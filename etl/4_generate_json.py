#!/usr/bin/env python3
"""
Gera todos os arquivos JSON finais para o frontend Next.js.
Usa pontos_ima.json como fonte canônica (260 pontos com coords).
Complementa com histórico dos PDFs para os pontos linkados.
"""
import json
from pathlib import Path
from collections import defaultdict

ETL_DIR = Path(__file__).parent
WEB_DATA = ETL_DIR.parent / "web" / "public" / "data"
WEB_DATA.mkdir(parents=True, exist_ok=True)
(WEB_DATA / "por_ponto").mkdir(exist_ok=True)
(WEB_DATA / "por_municipio").mkdir(exist_ok=True)

IMA_FILE = ETL_DIR / "pontos_ima.json"
MEDICOES_FILE = ETL_DIR / "medicoes_normalizadas.json"
RAW_FILE = ETL_DIR / "raw_extractions.json"


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    kb = path.stat().st_size / 1024
    print(f"  ✓ {path.relative_to(ETL_DIR.parent)} ({kb:.1f} KB)")


def main():
    pontos_ima = json.loads(IMA_FILE.read_text())
    medicoes_pdf = json.loads(MEDICOES_FILE.read_text())
    raw = json.loads(RAW_FILE.read_text())

    # Indexar medições PDF por pdf_id
    med_por_pdf_id = defaultdict(list)
    for m in medicoes_pdf:
        med_por_pdf_id[m["ponto_id"]].append(m)

    # Ordenar por data
    for pid in med_por_pdf_id:
        med_por_pdf_id[pid].sort(key=lambda x: x["data_coleta"])

    # ----------------------------------------------------------------
    # Construir pontos finais (260 pontos IMA + histórico PDF)
    # ----------------------------------------------------------------
    pontos_finais = []

    for p in pontos_ima:
        pdf_id = p.get("pdf_id")
        hist_pdf = med_por_pdf_id.get(pdf_id, []) if pdf_id else []

        # Histórico completo: PDF + recente IMA (sem duplicatas por data)
        historico_completo = []
        datas_vistas = set()

        for m in hist_pdf:
            d = m["data_coleta"]
            if d not in datas_vistas:
                historico_completo.append({
                    "data": d,
                    "status": m["status"],
                    "relatorio": m["relatorio_num"],
                    "temporada": m["temporada"],
                    "fonte": "pdf",
                })
                datas_vistas.add(d)

        for m in p.get("historico_recente", []):
            d = m["data"]
            if d not in datas_vistas:
                historico_completo.append({
                    "data": d,
                    "status": m["status"],
                    "nmp": m.get("nmp"),
                    "chuva": m.get("chuva"),
                    "temp_agua": m.get("temp_agua"),
                    "fonte": "api",
                })
                datas_vistas.add(d)

        historico_completo.sort(key=lambda x: x["data"])

        # Calcular métricas
        ultimo = historico_completo[-1] if historico_completo else None
        consecutivas = 0
        for h in reversed(historico_completo):
            if h["status"] == "propria":
                consecutivas += 1
            else:
                break

        proprias = sum(1 for h in historico_completo if h["status"] == "propria")
        total = len(historico_completo)
        pct_hist = round(proprias / total * 100, 1) if total > 0 else None

        ponto_final = {
            "id": p["id"],
            "codigo_ima": p["codigo_ima"],
            "praia": p["praia"],
            "municipio": p["municipio"],
            "municipio_slug": p["municipio_slug"],
            "ponto_num": p["ponto_num"],
            "descricao": p["descricao"],
            "lat": p["lat"],
            "lon": p["lon"],
            "ultimo_status": ultimo["status"] if ultimo else None,
            "ultima_coleta": ultimo["data"] if ultimo else None,
            "semanas_proprias_consecutivas": consecutivas,
            "pct_proprias_historico": pct_hist,
            "total_coletas": total,
            "tem_historico_pdf": len(hist_pdf) > 0,
        }
        pontos_finais.append(ponto_final)

        # Arquivo por ponto
        write_json(WEB_DATA / "por_ponto" / f"{p['id']}.json", {
            "ponto": ponto_final,
            "historico": historico_completo,
        })

    # ----------------------------------------------------------------
    # pontos.json
    # ----------------------------------------------------------------
    write_json(WEB_DATA / "pontos.json", pontos_finais)

    # ----------------------------------------------------------------
    # municipios.json
    # ----------------------------------------------------------------
    mun_map = defaultdict(list)
    for p in pontos_finais:
        mun_map[p["municipio_slug"]].append(p)

    municipios = []
    for slug, pts in mun_map.items():
        proprias = sum(1 for p in pts if p["ultimo_status"] == "propria")
        improprias = sum(1 for p in pts if p["ultimo_status"] == "impropria")
        total_c = proprias + improprias
        pct = round(proprias / total_c * 100, 1) if total_c > 0 else None

        coords = [(p["lat"], p["lon"]) for p in pts if p.get("lat") and p.get("lon")]
        lat = round(sum(c[0] for c in coords) / len(coords), 4) if coords else None
        lon = round(sum(c[1] for c in coords) / len(coords), 4) if coords else None

        municipios.append({
            "slug": slug,
            "nome": pts[0]["municipio"],
            "n_pontos": len(pts),
            "n_proprias": proprias,
            "n_improprias": improprias,
            "n_sem_dados": len(pts) - total_c,
            "pct_proprias": pct,
            "lat": lat,
            "lon": lon,
        })

    municipios.sort(key=lambda m: m["nome"])
    write_json(WEB_DATA / "municipios.json", municipios)

    # ----------------------------------------------------------------
    # por_municipio/{slug}.json
    # ----------------------------------------------------------------
    for slug, pts in mun_map.items():
        pts_sorted = sorted(pts, key=lambda p: (p["praia"], p["ponto_num"] or 0))
        mun_info = next(m for m in municipios if m["slug"] == slug)
        write_json(WEB_DATA / "por_municipio" / f"{slug}.json", {
            "municipio": mun_info,
            "pontos": pts_sorted,
        })

    # ----------------------------------------------------------------
    # resumos.json — para gráficos de temporada
    # ----------------------------------------------------------------
    resumos = []
    for r in sorted(raw, key=lambda x: x["data_relatorio"]):
        rs = r.get("resumo", {})
        fp = rs.get("florianopolis_proprias") or 0
        fi = rs.get("florianopolis_improprias") or 0
        ip = rs.get("interior_proprias") or 0
        ii = rs.get("interior_improprias") or 0
        total = fp + fi + ip + ii
        pct = round((fp + ip) / total * 100, 2) if total > 0 else None
        resumos.append({
            "data": r["data_relatorio"],
            "relatorio": r["relatorio_num"],
            "temporada": r["temporada"],
            "arquivo": r["arquivo"],
            "floripa_proprias": fp,
            "floripa_improprias": fi,
            "interior_proprias": ip,
            "interior_improprias": ii,
            "total": total,
            "pct_proprias": pct,
        })

    write_json(WEB_DATA / "resumos.json", resumos)

    # ----------------------------------------------------------------
    # medicoes_recentes.json — últimas 6 medições de cada ponto (home)
    # ----------------------------------------------------------------
    med_por_ponto = defaultdict(list)
    for p in pontos_ima:
        pid = p["id"]
        pdf_id = p.get("pdf_id")
        hist_pdf = med_por_pdf_id.get(pdf_id, []) if pdf_id else []
        datas = set()
        combined = []
        for m in hist_pdf:
            if m["data_coleta"] not in datas:
                combined.append({"data": m["data_coleta"], "status": m["status"]})
                datas.add(m["data_coleta"])
        for m in p.get("historico_recente", []):
            if m["data"] not in datas:
                combined.append({"data": m["data"], "status": m["status"]})
                datas.add(m["data"])
        combined.sort(key=lambda x: x["data"])
        med_por_ponto[pid] = combined[-6:]

    write_json(WEB_DATA / "medicoes_recentes.json", dict(med_por_ponto))

    # ----------------------------------------------------------------
    # meta.json
    # ----------------------------------------------------------------
    total_proprias = sum(1 for p in pontos_finais if p.get("ultimo_status") == "propria")
    total_improprias = sum(1 for p in pontos_finais if p.get("ultimo_status") == "impropria")
    datas = [r["data_relatorio"] for r in raw]
    ultima_atualizacao = max(datas) if datas else "N/A"

    meta = {
        "ultima_atualizacao": ultima_atualizacao,
        "total_pontos": len(pontos_finais),
        "total_proprias": total_proprias,
        "total_improprias": total_improprias,
        "total_municipios": len(municipios),
        "total_relatorios": len(raw),
        "total_medicoes": sum(p["total_coletas"] for p in pontos_finais),
    }
    write_json(WEB_DATA / "meta.json", meta)

    # ----------------------------------------------------------------
    # Resumo
    # ----------------------------------------------------------------
    print(f"\n{'='*55}")
    print(f"✓ Pontos: {len(pontos_finais)} | Municípios: {len(municipios)}")
    print(f"✓ Status atual: {total_proprias} próprias / {total_improprias} impróprias")
    print(f"✓ Última atualização: {ultima_atualizacao}")
    print(f"✓ Total de relatórios: {len(raw)} | Medições: {sum(p['total_coletas'] for p in pontos_finais)}")


if __name__ == "__main__":
    main()
