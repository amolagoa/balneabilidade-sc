#!/usr/bin/env python3
"""
Normaliza os dados extraídos:
- Cria ID canônico por ponto (municipio_slug + praia_slug + ponto_num)
- Deduplica pontos com nomes ligeiramente diferentes
- Gera etl/pontos_unicos.json e etl/medicoes_normalizadas.json
"""
import json
import re
from pathlib import Path
from unidecode import unidecode

ETL_DIR = Path(__file__).parent
RAW = ETL_DIR / "raw_extractions.json"
OUT_PONTOS = ETL_DIR / "pontos_unicos.json"
OUT_MEDICOES = ETL_DIR / "medicoes_normalizadas.json"


def slugify(s: str) -> str:
    s = unidecode(s).lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


def make_ponto_id(municipio: str, praia: str, ponto_num) -> str:
    base = f"{slugify(municipio)}_{slugify(praia)}"
    if ponto_num is not None:
        return f"{base}_p{ponto_num}"
    return base


def clean_praia_name(praia: str) -> str:
    """Normaliza variações menores de nome."""
    praia = praia.strip()
    # Remove "BALN." / "BALN " abreviações
    praia = re.sub(r"\bBALN\.?\s+", "BALNEÁRIO ", praia, flags=re.IGNORECASE)
    # Padroniza acentos via title case depois de unidecode
    return praia.title()


def main():
    data = json.loads(RAW.read_text())

    # Mapa de pontos únicos: id → info consolidada
    pontos = {}
    medicoes = []

    for relatorio in data:
        rel_num = relatorio["relatorio_num"]
        rel_data = relatorio["data_relatorio"]
        temporada = relatorio["temporada"]
        arquivo = relatorio["arquivo"]

        for m in relatorio["medicoes"]:
            municipio = m["municipio"] or "Desconhecido"
            praia = clean_praia_name(m["praia"])
            ponto_num = m["ponto_num"]
            descricao = m["descricao"]
            data_coleta = m["data_coleta"]
            status = m["status"]

            ponto_id = make_ponto_id(municipio, praia, ponto_num)

            # Consolidar informações do ponto (usar a mais completa)
            if ponto_id not in pontos:
                pontos[ponto_id] = {
                    "id": ponto_id,
                    "praia": praia,
                    "municipio": municipio,
                    "municipio_slug": slugify(municipio),
                    "ponto_num": ponto_num,
                    "descricao": descricao,
                    "lat": None,
                    "lon": None,
                }
            else:
                # Atualiza descrição se a nova for mais longa
                if len(descricao) > len(pontos[ponto_id].get("descricao", "")):
                    pontos[ponto_id]["descricao"] = descricao

            medicoes.append({
                "ponto_id": ponto_id,
                "relatorio_num": rel_num,
                "temporada": temporada,
                "data_relatorio": rel_data,
                "data_coleta": data_coleta,
                "status": status,
            })

    pontos_list = sorted(pontos.values(), key=lambda p: (p["municipio"], p["praia"], p["ponto_num"] or 0))

    # Estatísticas
    municipios = {}
    for p in pontos_list:
        municipios.setdefault(p["municipio"], 0)
        municipios[p["municipio"]] += 1

    OUT_PONTOS.write_text(json.dumps(pontos_list, ensure_ascii=False, indent=2))
    OUT_MEDICOES.write_text(json.dumps(medicoes, ensure_ascii=False, indent=2))

    print(f"✓ {len(pontos_list)} pontos únicos identificados")
    print(f"✓ {len(medicoes)} medições normalizadas")
    print(f"✓ {len(municipios)} municípios:")
    for mun, n in sorted(municipios.items(), key=lambda x: -x[1]):
        print(f"    {mun}: {n} pontos")
    print(f"\n✓ Salvo em {OUT_PONTOS} e {OUT_MEDICOES}")


if __name__ == "__main__":
    main()
