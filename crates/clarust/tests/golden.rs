use std::fs;
use std::path::Path;
use std::process::Command;

fn normalize(s: &str) -> String {
    s.lines()
        .filter(|l| !l.trim_start().starts_with(";;") && !l.trim().is_empty())
        .map(|l| l.trim_end())
        .collect::<Vec<_>>()
        .join("\n")
}

// every example contract must transpile to its frozen expected.clar. the contracts
// themselves are real crates, so `cargo test` already proves they compile under
// rustc; this guards the compiler output against regressions.
#[test]
fn contracts_match_golden() {
    let contracts = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../contracts");
    let bin = env!("CARGO_BIN_EXE_clarust");
    let out = std::env::temp_dir().join("clarust-golden");

    let mut checked = 0;
    for entry in fs::read_dir(&contracts).unwrap() {
        let dir = entry.unwrap().path();
        let src = dir.join("src/lib.rs");
        let gold = dir.join("expected.clar");
        if !src.exists() || !gold.exists() {
            continue;
        }
        let name = dir.file_name().unwrap().to_string_lossy().into_owned();

        let res = Command::new(bin)
            .arg(&src)
            .arg("--plain")
            .arg("--out")
            .arg(&out)
            .output()
            .unwrap();
        assert!(res.status.success(), "transpile failed for {name}");

        let gen = fs::read_to_string(out.join(format!("{name}.clar"))).unwrap();
        let expected = fs::read_to_string(&gold).unwrap();
        assert_eq!(normalize(&gen), normalize(&expected), "golden mismatch for {name}");
        checked += 1;
    }
    assert!(checked >= 6, "expected to check at least 6 contracts, got {checked}");
}
