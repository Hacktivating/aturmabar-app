# Gender and dark-mode review

## Gender diagnosis

The members UI previously matched only the exact string `male` and otherwise fell through to the alternate display. Existing records can contain legacy values such as `man`, `M`, `laki-laki`, `pria`, or equivalent female variants, so the raw value was not normalized before rendering. The backend schema currently defaults new records to `male`, but that default does not repair older or differently formatted values already stored in the database.

The members page now normalizes common male and female values case-insensitively in both desktop and mobile layouts. Unknown or missing values intentionally render as an em dash instead of being misclassified.

## Dark-mode review

The dark palette was changed from flat near-black surfaces to a layered neutral system: deep blue-charcoal app background, slightly lighter surface cards, elevated charcoal panels, warm-white primary text, muted gray secondary text, and stronger neutral borders. Legacy colorful dark status utilities are visually remapped to the charcoal elevated surface while preserving success/error meaning through labels and icons.

The login route was checked in both modes after the change. The theme toggle remains functional, the card has clearer separation from the page background, and primary controls retain readable contrast.
