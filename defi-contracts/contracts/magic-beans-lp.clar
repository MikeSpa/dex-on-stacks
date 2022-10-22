;; magic-beans-lp
;; LP token for magic-beans
(define-fungible-token magic-beans-lp)

;; errors
(define-constant err-minter-only (err u300))
(define-constant err-amount-zero (err u301))

;; DATA
(define-data-var allowed-minter principal tx-sender)

;; GETTER
(define-read-only (get-symbol)
  (ok "MAGIC-LP")
)
(define-read-only (get-decimals) 
  (ok u6)
)

(define-read-only (get-balance (who principal))
  (ft-get-balance magic-beans-lp who)
)

(define-read-only (get-total-supply)
  (ft-get-supply magic-beans-lp)
)

;; MINT AND BURN

;; Change the minter to any other principal, can only be called the current minter
(define-public (set-minter (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get allowed-minter)) err-minter-only)
    ;; who is unchecked, we allow the minter to make whoever they like the new minter
    ;; #[allow(unchecked_data)]
    (ok (var-set allowed-minter who))
  )
)

;; Custom function to mint tokens, only available to our exchange
(define-public (mint (amount uint) (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get allowed-minter)) err-minter-only)
    (asserts! (> amount u0) err-amount-zero)
    ;; amount, who are unchecked, but we let the contract owner mint to whoever they like for convenience
    ;; #[allow(unchecked_data)]
    (ft-mint? magic-beans-lp amount who)
  )
)

;; Any user can burn any amount of their own tokens
;; returns (ok true) or (err 1)
(define-public (burn (amount uint))
  (ft-burn? magic-beans-lp amount tx-sender)
)