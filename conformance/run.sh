#!/usr/bin/env bash
# conformance: every contract must compile under rustc (it is real rust), transpile
# to the frozen golden clarity, and pass clarinet check.
set -u
cd "$(dirname "$0")/.."

BIN=./target/release/clarust
CARGO_HOME="${CARGO_HOME:-$PWD/.cargo-home}"
export CARGO_HOME

cargo build --release -q 2>/dev/null

normalize() { grep -v '^[[:space:]]*;;' "$1" | sed '/^[[:space:]]*$/d;s/[[:space:]]*$//'; }

# runs clarinet check on a contract plus the trait libs it depends on; echoes
# "clarinet:ok" on success, nothing on failure
check_with_deps() {
  local name=$1 gen=$2
  local proj=.work/proj
  rm -rf "$proj"; mkdir -p "$proj/contracts" "$proj/settings"
  cat > "$proj/Clarinet.toml" <<EOF
[project]
name = "conf"
authors = []
telemetry = false
cache_dir = "./.cache"
EOF
  cat > "$proj/settings/Devnet.toml" <<'EOF'
[network]
name = "devnet"
deployment_fee_rate = 10

[accounts.deployer]
mnemonic = "twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw"
balance = 100000000000000
EOF
  for lib in conformance/lib/*.clar; do
    local ln; ln=$(basename "$lib" .clar)
    cp "$lib" "$proj/contracts/"
    printf '\n[contracts.%s]\npath = "contracts/%s.clar"\nclarity_version = 3\nepoch = "3.0"\n' "$ln" "$ln" >> "$proj/Clarinet.toml"
  done
  cp "$gen" "$proj/contracts/$name.clar"
  printf '\n[contracts.%s]\npath = "contracts/%s.clar"\nclarity_version = 3\nepoch = "3.0"\n' "$name" "$name" >> "$proj/Clarinet.toml"
  if (cd "$proj" && clarinet check 2>&1 | grep -q "contracts checked"); then
    echo "clarinet:ok"
  fi
}

pass=0; fail=0
for dir in contracts/*/; do
  name=$(basename "$dir")
  src="$dir/src/lib.rs"
  gold="$dir/expected.clar"
  [ -f "$src" ] || continue

  # 1. real rust: compiles under rustc
  if cargo build --release -q -p "$name-contract" 2>/dev/null; then
    rustc_ok="rustc:ok"
  else
    printf 'FAIL  %-9s rustc compile\n' "$name"; fail=$((fail+1)); continue
  fi

  # 2. golden: transpiles to the expected clarity
  "$BIN" "$src" --plain --out .work >/dev/null 2>&1
  gen=".work/$name.clar"
  if [ -f "$gold" ] && diff <(normalize "$gen") <(normalize "$gold") >/dev/null; then
    gold_ok="golden:ok"
  else
    printf 'FAIL  %-9s golden mismatch\n' "$name"; fail=$((fail+1)); continue
  fi

  # 3. clarinet accepts the generated clarity. a contract that implements a trait
  # needs the trait contract present, so scaffold a project with the lib deps.
  if grep -q "impl-trait" "$gold"; then
    clarinet_ok=$(check_with_deps "$name" "$gen")
  elif "$BIN" "$src" --check >/dev/null 2>&1; then
    clarinet_ok="clarinet:ok"
  else
    clarinet_ok=""
  fi
  if [ -n "$clarinet_ok" ]; then
    printf 'PASS  %-9s %s  %s  %s\n' "$name" "$rustc_ok" "$gold_ok" "$clarinet_ok"; pass=$((pass+1))
  else
    printf 'FAIL  %-9s clarinet check\n' "$name"; fail=$((fail+1))
  fi
done

rm -rf .work
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
