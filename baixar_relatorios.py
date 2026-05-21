#!/usr/bin/env python3
"""
Baixa todos os relatórios de balneabilidade disponíveis em:
https://balneabilidade.ima.sc.gov.br/relatorio/downloadPDF/YYYY-MM-DD

Estratégia: varre todas as datas de cada temporada (out-mai) de 2019 a 2026,
detecta PDFs reais pelo Content-Disposition (com número) e baixa apenas esses.
"""

import os
import re
import time
import requests
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://balneabilidade.ima.sc.gov.br/relatorio/downloadPDF/{}"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "relatorios")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0 (compatible; balneability-downloader/1.0)"})


def date_range(start: date, end: date):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def build_candidate_dates():
    """Gera todas as datas candidatas: outubro a maio de cada temporada."""
    candidates = []
    # Temporadas: out-mai de 2019/2020 até 2025/2026
    for start_year in range(2019, 2026):
        season_start = date(start_year, 10, 1)
        season_end = date(start_year + 1, 5, 31)
        for d in date_range(season_start, season_end):
            if d <= date.today():
                candidates.append(d)
    return candidates


def check_and_download(d: date):
    url = BASE_URL.format(d.isoformat())
    try:
        resp = SESSION.get(url, timeout=30, stream=True)
        if resp.status_code != 200:
            return None, d, f"HTTP {resp.status_code}"

        cd = resp.headers.get("content-disposition", "")
        # Extrai filename: relatorio_n28-2026.pdf → número presente = real
        match = re.search(r'filename=relatorio_n(\d+)-(\d+)\.pdf', cd)
        if not match:
            # Não é um relatório real (sem número no filename)
            resp.close()
            return None, d, "sem relatório"

        numero = match.group(1)
        ano = match.group(2)
        filename = f"relatorio_n{numero}-{ano}_{d.isoformat()}.pdf"
        filepath = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(filepath):
            resp.close()
            return filename, d, "já existe"

        content = resp.content
        if len(content) < 5000:
            return None, d, f"conteúdo pequeno ({len(content)} bytes)"

        with open(filepath, "wb") as f:
            f.write(content)

        return filename, d, f"OK ({len(content):,} bytes)"

    except Exception as e:
        return None, d, f"erro: {e}"


def main():
    candidates = build_candidate_dates()
    print(f"Verificando {len(candidates)} datas candidatas...")
    print(f"Salvando em: {OUTPUT_DIR}\n")

    downloaded = []
    errors = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(check_and_download, d): d for d in candidates}
        done = 0
        for future in as_completed(futures):
            done += 1
            filename, d, status = future.result()
            if filename and "OK" in status:
                downloaded.append((d, filename, status))
                print(f"  [BAIXADO] {d} → {filename} {status}")
            elif filename and "já existe" in status:
                downloaded.append((d, filename, status))
            elif "sem relatório" not in status and "erro" not in status.lower():
                pass  # ignora datas sem relatório silenciosamente
            elif "erro" in status.lower():
                errors.append((d, status))
                print(f"  [ERRO] {d}: {status}")

            if done % 100 == 0:
                print(f"  ... {done}/{len(candidates)} verificadas, {len(downloaded)} relatórios encontrados")

    print(f"\n{'='*60}")
    print(f"Concluído! {len(downloaded)} relatórios baixados/encontrados.")
    if errors:
        print(f"{len(errors)} erros encontrados.")

    downloaded.sort(key=lambda x: x[0])
    print("\nRelatórios disponíveis:")
    for d, fname, status in downloaded:
        print(f"  {d} → {fname}")


if __name__ == "__main__":
    main()
