#!/usr/bin/env python3
"""
Busca os 260 pontos oficiais com coordenadas e dados recentes via API do IMA.
Salva em etl/pontos_ima.json (fonte canônica de pontos e coords).
"""
import json
import re
from pathlib import Path
from unidecode import unidecode
import requests

ETL_DIR = Path(__file__).parent
PONTOS_FILE = ETL_DIR / "pontos_unicos.json"
IMA_PONTOS_FILE = ETL_DIR / "pontos_ima.json"

IMA_MAPA_URL = "https://balneabilidade.ima.sc.gov.br/relatorio/mapa"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "balneabilidade-sc-comunidade/1.0"})


def slugify(s: str) -> str:
    s = unidecode(s).lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def normalize_status(s: str) -> str:
    s = s.strip().upper()
    if "IMPR" in s:
        return "impropria"
    if "PR" in s:
        return "propria"
    return "indeterminado"


def main():
    print("Buscando pontos oficiais da API do IMA...")
    resp = SESSION.post(IMA_MAPA_URL, timeout=30)
    data = resp.json()
    print(f"✓ {len(data)} pontos recebidos da API IMA")

    # Estrutura canônica de cada ponto
    pontos_ima = []
    for item in data:
        municipio = item.get("MUNICIPIO", "").title()
        praia = item.get("BALNEARIO", "").title()
        ponto_nome = item.get("PONTO_NOME", "")
        # Extrai número do ponto: "Ponto 01" → 1
        m = re.search(r"\d+", ponto_nome)
        ponto_num = int(m.group()) if m else None

        codigo = str(item.get("CODIGO", ""))
        lat = float(item["LATITUDE"]) if item.get("LATITUDE") else None
        lon = float(item["LONGITUDE"]) if item.get("LONGITUDE") else None

        # Últimas análises (API retorna últimas 5)
        analises = item.get("ANALISES", [])
        historico_recente = []
        for a in analises:
            data_raw = a.get("DATA", "")
            # Converte dd/mm/yyyy → yyyy-mm-dd
            partes = data_raw.split("/")
            data_iso = f"{partes[2]}-{partes[1]}-{partes[0]}" if len(partes) == 3 else data_raw
            historico_recente.append({
                "data": data_iso,
                "status": normalize_status(a.get("CONDICAO", "")),
                "nmp": int(a["RESULTADO"]) if a.get("RESULTADO", "").isdigit() else None,
                "chuva": a.get("CHUVA", ""),
                "temp_agua": float(a["TEMP_AGUA"]) if a.get("TEMP_AGUA") else None,
            })
        historico_recente.sort(key=lambda x: x["data"])

        ultimo_status = historico_recente[-1]["status"] if historico_recente else None

        pontos_ima.append({
            "codigo_ima": codigo,
            "id": f"ima_{codigo}",
            "praia": praia,
            "municipio": municipio,
            "municipio_slug": slugify(municipio),
            "ponto_num": ponto_num,
            "descricao": item.get("LOCALIZACAO", ""),
            "lat": lat,
            "lon": lon,
            "ultimo_status": ultimo_status,
            "ultima_coleta": historico_recente[-1]["data"] if historico_recente else None,
            "historico_recente": historico_recente,
        })

    pontos_ima.sort(key=lambda p: (p["municipio"], p["praia"], p["ponto_num"] or 0))
    IMA_PONTOS_FILE.write_text(json.dumps(pontos_ima, ensure_ascii=False, indent=2))

    # Estatísticas
    com_coords = sum(1 for p in pontos_ima if p["lat"])
    municipios = {}
    for p in pontos_ima:
        municipios.setdefault(p["municipio"], 0)
        municipios[p["municipio"]] += 1

    print(f"✓ {com_coords}/{len(pontos_ima)} pontos com coordenadas")
    print(f"✓ {len(municipios)} municípios: {', '.join(sorted(municipios))}")
    print(f"✓ Salvo em {IMA_PONTOS_FILE}")

    # Agora fazer o merge: match pontos IMA ↔ medições extraídas dos PDFs
    pontos_pdf = json.loads(PONTOS_FILE.read_text())
    print(f"\nFazendo merge com {len(pontos_pdf)} pontos extraídos dos PDFs...")

    # Estratégia: para cada ponto IMA, achar medições PDF pelo (municipio + praia + ponto_num)
    def norm(s): return re.sub(r"[^a-z0-9]", "", unidecode(str(s)).lower())

    # Build lookup: (municipio_norm, praia_norm, ponto_num) → ponto_pdf_id
    pdf_lookup = {}
    for p in pontos_pdf:
        key = (norm(p["municipio"]), norm(p["praia"]), p.get("ponto_num"))
        pdf_lookup[key] = p["id"]

    matched = 0
    for pima in pontos_ima:
        key = (norm(pima["municipio"]), norm(pima["praia"]), pima["ponto_num"])
        if key in pdf_lookup:
            pima["pdf_id"] = pdf_lookup[key]
            matched += 1
        else:
            # Tenta match sem número de ponto
            key2 = (norm(pima["municipio"]), norm(pima["praia"]), None)
            if key2 in pdf_lookup:
                pima["pdf_id"] = pdf_lookup[key2]
                matched += 1
            else:
                pima["pdf_id"] = None

    print(f"✓ {matched}/{len(pontos_ima)} pontos IMA linkados ao histórico dos PDFs")
    IMA_PONTOS_FILE.write_text(json.dumps(pontos_ima, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
