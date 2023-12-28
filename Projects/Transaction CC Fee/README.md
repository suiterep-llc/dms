# Transaction CC Fee

### Basic Automation Rules

- Runs in Customer Portal (client script)
- If customer attempts to pay with Credit Card, add percentage fee to total and
  alert customer that total has been updated to reflect 2.5% convenience fee for
  using a card (Client Script)
- On save, client script calls SuiteLet that generates appropriate Invoice for
  customer payment
- On payment creation (beforeSubmit()?) apply payment to new invoice

### Additional Requirements

1. Add fee to a new invoice
2. Charge the fee on all cards (including debit cards)
3. Do not charge in states where prohibited by law (based on shipping address)
