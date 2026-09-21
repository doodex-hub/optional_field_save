#!/usr/bin/env bash
# ==========================================================================
# run-test.sh — wrapper WAJIB untuk SEMUA eksekusi test G1/Step 9 lewat Docker
# (diinstansiasi dari migration-tool/templates/run-test.sh.template, 2026-09-21)
# ==========================================================================
# KENAPA FILE INI ADA (jangan hapus catatan ini):
#
# 1. Argumen `--test-tags /{{MODULE_NAME}}` (diawali garis miring) rawan di-mangle
#    MSYS/Git Bash di Windows jadi path Windows SEBELUM sampai ke `docker compose`/
#    `odoo-bin` — bikin tag filter kosong, hasil "0 failed, 0 error(s) of 0 tests"
#    yang TAMPAK sukses tapi TIDAK ADA test yang benar-benar jalan. Wrapper ini
#    hardcode MSYS_NO_PATHCONV=1, tidak bergantung ingatan manual.
# 2. **Gotcha TAMBAHAN yang ditemukan sesi ini (2026-09-21, di luar yang sudah
#    diantisipasi template) — DB yang sudah pernah `-i` (install) sebelumnya
#    membuat `-i` jadi no-op, install+test DIAM-DIAM di-skip, hasil "0 failed,
#    0 error(s) of 0 tests" — TAMPAK IDENTIK dengan gotcha #1 tapi akar masalah
#    beda (DB stale, bukan tag mangling).** Wrapper ini SELALU `docker compose
#    down -v` dulu sebelum run, supaya kedua gotcha di atas otomatis dicegah
#    tanpa bergantung ingatan AI/dev.
#
# Sanity-check otomatis: jumlah baris log "Starting <Class>.<method>" HARUS
# cocok jumlah test yang diharapkan — exit code non-nol kalau 0 test ter-start.
#
# USAGE (dari folder docker-env/, sejajar docker-compose.yml):
#   ./run-test.sh <service> <db_name> <module_name> [tag_tambahan]
#
# CONTOH:
#   ./run-test.sh odoo optional_field_save_20_test optional_field_save
# ==========================================================================
set -euo pipefail

SERVICE="${1:?Usage: run-test.sh <service> <db_name> <module_name> [extra_tags]}"
DB_NAME="${2:?Usage: run-test.sh <service> <db_name> <module_name> [extra_tags]}"
MODULE_NAME="${3:?Usage: run-test.sh <service> <db_name> <module_name> [extra_tags]}"
EXTRA_TAGS="${4:-}"

TAGS="/${MODULE_NAME}${EXTRA_TAGS}"
LOGFILE="$(mktemp)"
ADDONS_PATH="/opt/odoo/addons,/opt/odoo/odoo/addons,/mnt/extra-addons"

echo "=== run-test.sh: MSYS_NO_PATHCONV=1 dipaksa otomatis + fresh DB (down -v) setiap run ==="
echo "=== service=${SERVICE} db=${DB_NAME} module=${MODULE_NAME} tags=${TAGS} ==="
echo "=== log lengkap: ${LOGFILE} ==="
echo ""

echo "=== Membersihkan container/volume lama (mencegah gotcha 'DB stale = 0 test di-skip') ==="
docker compose down -v 2>&1 | tail -10

# --without-demo=all: DB test meniru kondisi produksi (selalu tanpa demo data),
# bukan sandbox demo-heavy — demo data bisa diam-diam menutupi bug yang cuma
# muncul di DB kosong.
MSYS_NO_PATHCONV=1 docker compose run --rm "${SERVICE}" \
  -d "${DB_NAME}" -i "${MODULE_NAME},contacts" --without-demo=all \
  --addons-path="${ADDONS_PATH}" \
  --test-enable --test-tags "${TAGS}" --stop-after-init 2>&1 | tee "${LOGFILE}"

echo ""
echo "=== Sanity check otomatis (menggantikan cek manual di 09_DEV_TESTING.md) ==="

STARTED_COUNT=$(grep -c "Starting " "${LOGFILE}" || true)
SUMMARY_LINE=$(grep -E "[0-9]+ failed, [0-9]+ error\(s\) of [0-9]+ tests" "${LOGFILE}" | tail -1 || true)

echo "Baris 'Starting <Class>.<method>' ditemukan: ${STARTED_COUNT}"
echo "Baris ringkasan resmi Odoo: ${SUMMARY_LINE:-'(tidak ditemukan sama sekali di log)'}"

if [ "${STARTED_COUNT}" -eq 0 ]; then
  echo ""
  echo "GAGAL — 0 test 'Starting' ditemukan di log. Ini pola false-pass yang"
  echo "didokumentasikan di 09_DEV_TESTING.md — JANGAN percaya exit code/ringkasan"
  echo "'0 failed, 0 error(s)' begitu saja. Buka ${LOGFILE} dan cari akar masalahnya."
  exit 2
fi

echo ""
echo "OK — ${STARTED_COUNT} test method benar-benar ter-eksekusi (bukan false-pass)."

docker compose down -v 2>&1 | tail -10
