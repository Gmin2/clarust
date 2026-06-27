(define-fungible-token coin)
(define-public (mint (amount uint) (recipient principal))
  (ft-mint? coin amount recipient))
(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq sender tx-sender) (err u1))
    (ft-transfer? coin amount sender recipient)))
(define-read-only (get-balance (who principal))
  (ok (ft-get-balance coin who)))
