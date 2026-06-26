mod emit;
mod frontend;
mod ir;

use std::fs;
use std::path::Path;
use std::process::Command;

use emit::Emitted;

const DEVNET: &str = r#"[network]
name = "devnet"
deployment_fee_rate = 10

[accounts.deployer]
mnemonic = "twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw"
balance = 100000000000000
"#;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("usage: clarust <input> [--out <dir>] [--plain] [--check]");
        std::process::exit(2);
    }
    let input = &args[1];
    let plain = args.iter().any(|a| a == "--plain");
    let check = args.iter().any(|a| a == "--check");
    let out_dir = match args.iter().position(|a| a == "--out") {
        Some(i) => args.get(i + 1).cloned().unwrap_or_else(|| "clarity-out".into()),
        None => "clarity-out".into(),
    };

    let text = fs::read_to_string(input).unwrap_or_else(|e| {
        eprintln!("cannot read {input}: {e}");
        std::process::exit(1);
    });

    let fe = frontend::select(input);
    let contract = fe.parse(&text).unwrap_or_else(|e| {
        eprintln!("{e}");
        std::process::exit(1);
    });

    let result = emit::emit(&contract, fe.name(), !plain);

    if check {
        std::process::exit(run_check(input, &contract.name, &text, &result));
    }

    fs::create_dir_all(&out_dir).ok();
    let out_path = Path::new(&out_dir).join(format!("{}.clar", contract.name));
    fs::write(&out_path, &result.clarity).unwrap();

    println!("=== {}-flavored source ({input}) ===\n", fe.name());
    println!("{}", text.trim_end());
    println!("\n=== generated clarity ({}) ===\n", out_path.display());
    println!("{}", result.clarity.trim_end());
    println!("\n=== how it maps (what a clarity newcomer should learn) ===\n");
    for n in &result.notes {
        println!("  - {n}");
    }
    println!();
}

// runs clarinet check on a throwaway project and rewrites the diagnostic locations
// from generated-clarity lines back to the source the developer actually wrote
fn run_check(input: &str, name: &str, source: &str, result: &Emitted) -> i32 {
    let proj = std::env::temp_dir().join(format!("clarust-check-{name}"));
    let _ = fs::remove_dir_all(&proj);
    fs::create_dir_all(proj.join("contracts")).ok();
    fs::create_dir_all(proj.join("settings")).ok();
    fs::write(
        proj.join("Clarinet.toml"),
        format!(
            "[project]\nname = \"clarust-check\"\nauthors = []\ntelemetry = false\ncache_dir = \"./.cache\"\n\n[contracts.{name}]\npath = \"contracts/{name}.clar\"\nclarity_version = 3\nepoch = \"3.0\"\n"
        ),
    )
    .ok();
    fs::write(proj.join("settings/Devnet.toml"), DEVNET).ok();
    fs::write(proj.join("contracts").join(format!("{name}.clar")), &result.clarity).ok();

    let output = match Command::new("clarinet").arg("check").current_dir(&proj).output() {
        Ok(o) => o,
        Err(e) => {
            eprintln!("could not run clarinet: {e}");
            return 1;
        }
    };
    let mut raw = String::from_utf8_lossy(&output.stdout).to_string();
    raw.push_str(&String::from_utf8_lossy(&output.stderr));

    let src_lines: Vec<&str> = source.lines().collect();
    print!("{}", translate(&raw, &result.src_map, input, &src_lines));
    output.status.code().unwrap_or(1)
}

fn translate(raw: &str, map: &[Option<usize>], input: &str, src_lines: &[&str]) -> String {
    let mut out = String::new();
    for line in raw.lines() {
        // drop clarinet's "what's next" footer
        if line.trim_start().starts_with("----") {
            break;
        }
        let trimmed = line.trim_start();
        if let Some(rest) = trimmed.strip_prefix("-->") {
            let loc = rest.trim();
            let mut parts = loc.rsplitn(3, ':');
            let col = parts.next().unwrap_or("");
            let lno = parts.next().unwrap_or("");
            let _path = parts.next().unwrap_or("");
            if let Ok(l) = lno.parse::<usize>() {
                if let Some(sl) = map.get(l.saturating_sub(1)).and_then(|x| *x) {
                    let srctext = src_lines.get(sl - 1).map(|s| s.trim()).unwrap_or("");
                    out.push_str(&format!("--> {input}:{sl}:{col}\n"));
                    out.push_str(&format!("   {srctext}\n"));
                    continue;
                }
            }
        }
        out.push_str(line);
        out.push('\n');
    }
    out
}
