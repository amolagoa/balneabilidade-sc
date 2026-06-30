#!/usr/bin/env python3
"""
Extrai dados de todos os PDFs de balneabilidade.
Saída: etl/raw_extractions.json
"""
import json
import re
import sys
from pathlib import Path
import pdfplumber
from unidecode import unidecode

RELATORIOS_DIR = Path(__file__).parent.parent / "relatorios"
OUTPUT = Path(__file__).parent / "raw_extractions.json"

# Regex para extrair número do ponto: "PRAIA X (Ponto 27)"
RE_PONTO = re.compile(r"\(Ponto\s+(\d+)\)", re.IGNORECASE)
# Regex para extrair número e ano do nome do arquivo
RE_ARQUIVO = re.compile(r"relatorio_n(\d+)-(\d{4})_(\d{4}-\d{2}-\d{2})\.pdf")
# Regex para data dd/mm/yyyy
RE_DATA = re.compile(r"\b(\d{2}/\d{2}/\d{4})\b")
# Linha de cabeçalho de município: maiúsculas, sem pipe, sem data
RE_MUNICIPIO = re.compile(r"^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s\-]+$")


def parse_data(s: str):
    """Converte dd/mm/yyyy → yyyy-mm-dd."""
    m = RE_DATA.search(s)
    if not m:
        return None
    d, mo, y = m.group(1).split("/")
    return f"{y}-{mo}-{d}"


def normalize_status(s: str) -> str:
    s = s.strip().upper()
    if "IMPR" in s:
        return "impropria"
    if "PR" in s:
        return "propria"
    return "indeterminado"


def extract_praia_ponto(local_raw: str):
    """Extrai nome da praia e número do ponto do texto bruto."""
    lines = [l.strip() for l in local_raw.strip().splitlines() if l.strip()]
    if not lines:
        return "", None, ""

    first = lines[0]
    m = RE_PONTO.search(first)
    ponto_num = int(m.group(1)) if m else None
    # Nome da praia é tudo antes do "(Ponto X)"
    praia = RE_PONTO.sub("", first).strip()
    # Descrição do local são as linhas seguintes
    descricao = " ".join(lines[1:])
    return praia, ponto_num, descricao


MUNICIPIOS_SC = {
    "ARARANGUÁ", "ARARANGUA",
    "BALNEÁRIO ARROIO DO SILVA", "BALNEARIO ARROIO DO SILVA",
    "BALNEÁRIO CAMBORIÚ", "BALNEARIO CAMBORIU",
    "BALNEÁRIO DA BARRA DO SUL", "BALNEARIO DA BARRA DO SUL",
    "BALNEÁRIO GAIVOTA", "BALNEARIO GAIVOTA",
    "BALNEÁRIO PIÇARRAS", "BALNEARIO PICARRAS",
    "BALNEÁRIO RINCÃO", "BALNEARIO RINCAO",
    "BARRA VELHA",
    "BIGUAÇÚ", "BIGUACU",
    "BOMBINHAS",
    "FLORIANÓPOLIS", "FLORIANOPOLIS",
    "GAROPABA",
    "GOVERNADOR CELSO RAMOS",
    "IMBITUBA",
    "ITAJAÍ", "ITAJAI",
    "ITAPEMA",
    "ITAPOÁ", "ITAPOA",
    "JAGUARUNA",
    "JOINVILLE",
    "LAGUNA",
    "NAVEGANTES",
    "PALHOÇA", "PALHOCA",
    "PASSO DE TORRES",
    "PAULO LOPES",
    "PENHA",
    "PORTO BELO",
    "SÃO FRANCISCO DO SUL", "SAO FRANCISCO DO SUL",
    "SÃO JOSÉ", "SAO JOSE",
    "TIJUCAS",
}


def is_municipio_header(text: str) -> bool:
    text = text.strip().upper()
    # Normaliza acentos para comparação
    text_norm = unidecode(text)
    for mun in MUNICIPIOS_SC:
        if unidecode(mun) == text_norm:
            return True
    return False


def extract_pdf(pdf_path: Path) -> dict:
    m = RE_ARQUIVO.match(pdf_path.name)
    if not m:
        return {}

    relatorio_num = int(m.group(1))
    ano_arquivo = int(m.group(2))
    data_relatorio = m.group(3)

    medicoes = []
    resumo = {}
    municipio_atual = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # --- Tenta extrair tabela estruturada ---
            tables = page.extract_tables()
            text_lines = (page.extract_text() or "").splitlines()

            # Detectar município nas linhas de texto
            for line in text_lines:
                line = line.strip()
                if is_municipio_header(line):
                    # Evitar falsos positivos comuns
                    if line not in ("BALNEÁRIO / LOCAL DE COLETA", "DATA DA COLETA", "SITUAÇÃO",
                                    "ALTERAÇÃO DA CONDIÇÃO DE BALNEABILIDADE",
                                    "PRÓPRIO PARA IMPRÓPRIO", "IMPRÓPRIO PARA PRÓPRIO",
                                    "CONDIÇÃO GERAL DE BALNEABILIDADE"):
                        municipio_atual = line.title()

            # Extrair medições das tabelas
            for table in tables:
                if not table:
                    continue
                for row in table:
                    if not row or len(row) < 3:
                        continue
                    col0 = (row[0] or "").strip()
                    col1 = (row[1] or "").strip()
                    col2 = (row[2] or "").strip()

                    # Pular cabeçalhos
                    if "BALNEÁRIO" in col0.upper() and "LOCAL" in col0.upper():
                        continue
                    if not col0 or not col2:
                        continue

                    data_coleta = parse_data(col1)
                    status = normalize_status(col2)
                    if status == "indeterminado" and not col2:
                        continue

                    praia, ponto_num, descricao = extract_praia_ponto(col0)

                    if not praia or data_coleta is None:
                        continue

                    medicoes.append({
                        "municipio": municipio_atual,
                        "praia": praia,
                        "ponto_num": ponto_num,
                        "descricao": descricao,
                        "data_coleta": data_coleta,
                        "status": status,
                    })

            # Extrair resumo (última página tem tabela de totais)
            full_text = page.extract_text() or ""
            if "CONDIÇÃO GERAL DE BALNEABILIDADE" in full_text:
                nums = re.findall(r"\b(\d+)\b", full_text)
                nums = [int(n) for n in nums]
                # Padrão: floripa_prop, pct, interior_prop, pct, total_prop, pct, ...
                if len(nums) >= 6:
                    try:
                        resumo = {
                            "florianopolis_proprias": nums[0],
                            "florianopolis_improprias": nums[2],
                            "interior_proprias": nums[4],
                            "interior_improprias": nums[6] if len(nums) > 6 else None,
                            "total_pontos": nums[8] if len(nums) > 8 else None,
                        }
                    except IndexError:
                        pass

    # Detectar temporada pelo número do relatório e ano
    # Relatórios 1-x de nov/dez pertencem à temporada ANO/(ANO+1)
    # O arquivo traz o ano que foi batizado no servidor
    temporada = f"{ano_arquivo - 1}-{ano_arquivo}"
    # Heurística: se a data_relatorio é out/nov/dez, a temporada começa naquele ano
    mes = int(data_relatorio[5:7])
    if mes >= 10:
        temporada = f"{ano_arquivo}-{ano_arquivo + 1}"

    return {
        "relatorio_num": relatorio_num,
        "temporada": temporada,
        "data_relatorio": data_relatorio,
        "arquivo": pdf_path.name,
        "medicoes": medicoes,
        "resumo": resumo,
    }


def main():
    pdfs = sorted(RELATORIOS_DIR.glob("*.pdf"))
    print(f"Encontrados {len(pdfs)} PDFs")

    results = []
    erros = []

    for i, pdf in enumerate(pdfs, 1):
        try:
            data = extract_pdf(pdf)
            if data.get("medicoes"):
                results.append(data)
                n = len(data["medicoes"])
                print(f"  [{i:3d}/{len(pdfs)}] {pdf.name} → {n} medições (municipio último: {data['medicoes'][-1]['municipio']})")
            else:
                print(f"  [{i:3d}/{len(pdfs)}] {pdf.name} → 0 medições (ATENÇÃO)")
                erros.append(pdf.name)
        except Exception as e:
            print(f"  [{i:3d}/{len(pdfs)}] ERRO em {pdf.name}: {e}")
            erros.append(pdf.name)

    OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    total_medicoes = sum(len(r["medicoes"]) for r in results)
    print(f"\n✓ {len(results)} relatórios extraídos, {total_medicoes} medições totais")
    print(f"✓ Salvo em {OUTPUT}")
    if erros:
        print(f"⚠ {len(erros)} arquivos com problemas: {erros[:5]}")


if __name__ == "__main__":
    main()
