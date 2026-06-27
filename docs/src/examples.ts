export type Example = {
  slug: string
  title: string
  blurb: string
  rust: string
  clarity: string
}

export const examples: Example[] = [
  {
    slug: "counter",
    title: "Counter",
    blurb:
      "the smallest real contract: a single stored number with increment, a guarded decrement, and a read-only getter. shows data vars, let bindings, and if/else.",
    rust: `use clarust_lang::prelude::*;

#[contract]
pub struct Counter {
    count: DataVar<Uint>,
}

#[contract_impl]
impl Counter {
    #[public]
    pub fn increment(&self, step: Uint) -> Response<Uint, Uint> {
        let new_count = self.count.get() + step;
        self.count.set(new_count);
        ok(new_count)
    }

    #[public]
    pub fn decrement(&self, step: Uint) -> Response<Uint, Uint> {
        let current = self.count.get();
        if step > current {
            err(Uint(1))
        } else {
            self.count.set(current - step);
            ok(self.count.get())
        }
    }

    #[readonly]
    pub fn get_count(&self) -> Uint {
        self.count.get()
    }
}`,
    clarity: `(define-data-var count uint u0)

(define-public (increment (step uint))
  (let ((new-count (+ (var-get count) step)))
    (begin
      (var-set count new-count)
      (ok new-count))))

(define-public (decrement (step uint))
  (let ((current (var-get count)))
    (if (> step current)
        (err u1)
        (begin (var-set count (- current step)) (ok (var-get count))))))

(define-read-only (get-count)
  (var-get count))`,
  },
  {
    slug: "ledger",
    title: "Ledger",
    blurb:
      "a per-account balance sheet backed by a map. deposit adds to the caller's balance; a missing key reads as zero via unwrap_or.",
    rust: `use clarust_lang::prelude::*;

#[contract]
pub struct Ledger {
    balances: Map<Principal, Uint>,
}

#[contract_impl]
impl Ledger {
    #[public]
    pub fn deposit(&self, amount: Uint) -> Response<Uint, Uint> {
        let who = tx_sender();
        let current = self.balances.get(who).unwrap_or(Uint(0));
        self.balances.set(who, current + amount);
        ok(current + amount)
    }

    #[readonly]
    pub fn balance_of(&self, who: Principal) -> Uint {
        self.balances.get(who).unwrap_or(Uint(0))
    }
}`,
    clarity: `(define-map balances principal uint)

(define-public (deposit (amount uint))
  (let ((who tx-sender))
    (let ((current (default-to u0 (map-get? balances who))))
      (begin
        (map-set balances who (+ current amount))
        (ok (+ current amount))))))

(define-read-only (balance-of (who principal))
  (default-to u0 (map-get? balances who)))`,
  },
  {
    slug: "vault",
    title: "Vault",
    blurb:
      "the ledger plus a guarded withdraw. asserts() aborts the whole transaction when the balance is too low, so the subtraction can never underflow.",
    rust: `use clarust_lang::prelude::*;

#[contract]
pub struct Vault {
    deposits: Map<Principal, Uint>,
}

#[contract_impl]
impl Vault {
    #[public]
    pub fn deposit(&self, amount: Uint) -> Response<Uint, Uint> {
        let who = tx_sender();
        let current = self.deposits.get(who).unwrap_or(Uint(0));
        self.deposits.set(who, current + amount);
        ok(current + amount)
    }

    #[public]
    pub fn withdraw(&self, amount: Uint) -> Response<Uint, Uint> {
        let who = tx_sender();
        let current = self.deposits.get(who).unwrap_or(Uint(0));
        asserts(current >= amount, Uint(1));
        self.deposits.set(who, current - amount);
        ok(current - amount)
    }

    #[readonly]
    pub fn balance_of(&self, who: Principal) -> Uint {
        self.deposits.get(who).unwrap_or(Uint(0))
    }
}`,
    clarity: `(define-map deposits principal uint)

(define-public (withdraw (amount uint))
  (let ((who tx-sender))
    (let ((current (default-to u0 (map-get? deposits who))))
      (begin
        (asserts! (>= current amount) (err u1))
        (begin
          (map-set deposits who (- current amount))
          (ok (- current amount)))))))

(define-read-only (balance-of (who principal))
  (default-to u0 (map-get? deposits who)))`,
  },
  {
    slug: "coin",
    title: "Fungible token",
    blurb:
      "a plain fungible token. a FungibleToken field becomes define-fungible-token; the runtime tracks balances, so there is no manual balance sheet.",
    rust: `use clarust_lang::prelude::*;

#[contract]
pub struct Coin {
    coin: FungibleToken,
}

#[contract_impl]
impl Coin {
    #[public]
    pub fn mint(&self, amount: Uint, recipient: Principal) -> Response<bool, Uint> {
        ft_mint(self.coin, amount, recipient)
    }

    #[public]
    pub fn transfer(&self, amount: Uint, sender: Principal, recipient: Principal) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), Uint(1));
        ft_transfer(self.coin, amount, sender, recipient)
    }

    #[readonly]
    pub fn get_balance(&self, who: Principal) -> Response<Uint, Uint> {
        ok(ft_get_balance(self.coin, who))
    }
}`,
    clarity: `(define-fungible-token coin)

(define-public (mint (amount uint) (recipient principal))
  (ft-mint? coin amount recipient))

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq sender tx-sender) (err u1))
    (ft-transfer? coin amount sender recipient)))

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance coin who)))`,
  },
  {
    slug: "nft",
    title: "Non-fungible token",
    blurb:
      "a non-fungible token keyed by a uint id. NonFungibleToken<Uint> becomes define-non-fungible-token, and owner_of returns an Option that lowers to an optional.",
    rust: `use clarust_lang::prelude::*;

#[contract]
pub struct Nft {
    asset: NonFungibleToken<Uint>,
}

#[contract_impl]
impl Nft {
    #[public]
    pub fn mint(&self, id: Uint, recipient: Principal) -> Response<bool, Uint> {
        nft_mint(self.asset, id, recipient)
    }

    #[public]
    pub fn transfer(&self, id: Uint, sender: Principal, recipient: Principal) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), Uint(1));
        nft_transfer(self.asset, id, sender, recipient)
    }

    #[readonly]
    pub fn owner_of(&self, id: Uint) -> Option<Principal> {
        nft_get_owner(self.asset, id)
    }
}`,
    clarity: `(define-non-fungible-token asset uint)

(define-public (mint (id uint) (recipient principal))
  (nft-mint? asset id recipient))

(define-public (transfer (id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq sender tx-sender) (err u1))
    (nft-transfer? asset id sender recipient)))

(define-read-only (owner-of (id uint))
  (nft-get-owner? asset id))`,
  },
  {
    slug: "token",
    title: "SIP-010 token",
    blurb:
      "a full SIP-010 fungible token. #[impl_trait(...)] promises the contract matches the trait, and clarinet enforces every signature, including the (optional (buff 34)) memo.",
    rust: `use clarust_lang::prelude::*;

const ERR_NOT_OWNER: Uint = Uint(100);

#[contract]
#[impl_trait(".sip-010-trait.sip-010-trait")]
pub struct Token {
    clarity_coin: FungibleToken,
}

#[contract_impl]
impl Token {
    #[public]
    #[allow(unused_variables)]
    pub fn transfer(
        &self,
        amount: Uint,
        sender: Principal,
        recipient: Principal,
        memo: Option<Buff<34>>,
    ) -> Response<bool, Uint> {
        asserts(sender == tx_sender(), ERR_NOT_OWNER);
        ft_transfer(self.clarity_coin, amount, sender, recipient)
    }

    #[public]
    pub fn mint(&self, amount: Uint, recipient: Principal) -> Response<bool, Uint> {
        ft_mint(self.clarity_coin, amount, recipient)
    }

    #[readonly]
    pub fn get_name(&self) -> Response<StringAscii, Uint> {
        ok("Clarity Coin")
    }

    #[readonly]
    pub fn get_symbol(&self) -> Response<StringAscii, Uint> {
        ok("CC")
    }

    #[readonly]
    pub fn get_decimals(&self) -> Response<Uint, Uint> {
        ok(Uint(6))
    }

    #[readonly]
    pub fn get_balance(&self, who: Principal) -> Response<Uint, Uint> {
        ok(ft_get_balance(self.clarity_coin, who))
    }

    #[readonly]
    pub fn get_total_supply(&self) -> Response<Uint, Uint> {
        ok(ft_get_supply(self.clarity_coin))
    }

    #[readonly]
    pub fn get_token_uri(&self) -> Response<Option<StringUtf8>, Uint> {
        ok(none())
    }
}`,
    clarity: `(impl-trait .sip-010-trait.sip-010-trait)
(define-constant ERR-NOT-OWNER u100)
(define-fungible-token clarity-coin)

(define-public (transfer (amount uint) (sender principal)
                         (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq sender tx-sender) (err ERR-NOT-OWNER))
    (ft-transfer? clarity-coin amount sender recipient)))

(define-public (mint (amount uint) (recipient principal))
  (ft-mint? clarity-coin amount recipient))

(define-read-only (get-name) (ok "Clarity Coin"))
(define-read-only (get-symbol) (ok "CC"))
(define-read-only (get-decimals) (ok u6))
(define-read-only (get-balance (who principal))
  (ok (ft-get-balance clarity-coin who)))
(define-read-only (get-total-supply)
  (ok (ft-get-supply clarity-coin)))
(define-read-only (get-token-uri) (ok none))`,
  },
]
