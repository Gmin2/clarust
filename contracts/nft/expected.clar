(define-non-fungible-token asset uint)
(define-public (mint (id uint) (recipient principal))
  (nft-mint? asset id recipient))
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq sender tx-sender) (err u1))
    (nft-transfer? asset id sender recipient)))
(define-read-only (owner-of (id uint))
  (nft-get-owner? asset id))
