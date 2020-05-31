import { Card, CardType } from "./card";
import { serialize, deserialize } from "typescript-json-serializer";

let activeCards: Card[] = [];
let currentCard = 0;

function updatePreview() {
    let canvas = document.getElementById('preview') as HTMLCanvasElement;
    if (canvas && activeCards[currentCard]) {
        activeCards[currentCard].draw(canvas, 0);
    }
}

function onCardTypeChanged(event: Event) {
    const selectElem = event.target as HTMLSelectElement;
    if (selectElem && activeCards[currentCard]) {
        activeCards[currentCard]._heading = selectElem.selectedOptions[0].text;

        // Update the text in the Header input to match.
        $('#cardheader').val(activeCards[currentCard]._heading);

        if (selectElem.selectedOptions[0].text == 'Stratagem') {
            activeCards[currentCard]._type = CardType.Stratagem;
        }
        else if (selectElem.selectedOptions[0].text == 'Psychic Power') {
            activeCards[currentCard]._type = CardType.PsychicPower;
        }
        else if (selectElem.selectedOptions[0].text == 'Tactical Objective') {
            activeCards[currentCard]._type = CardType.TacticalObjective;
        }
        else if (selectElem.selectedOptions[0].text == 'Prayer') {
            activeCards[currentCard]._type = CardType.Prayer;
        }

        updateCardUI();
        updatePreview();
    }
}

function onCardStyleChanged(event: Event) {
    const selectElem = event.target as HTMLSelectElement;
    if (selectElem && activeCards[currentCard]) {
        // TODO: implement style
    }
}

function onHeaderChanged(event: Event) {
    const inputElem = event.target as HTMLInputElement;
    if (inputElem && activeCards[currentCard]) {
        activeCards[currentCard]._heading = inputElem.value;
        updatePreview();
    }
}

function onTitleChanged(event: Event) {
    const inputElem = event.target as HTMLInputElement;
    if (inputElem && activeCards[currentCard]) {
        activeCards[currentCard]._title = inputElem.value;
        updatePreview();
    }
}

function onRuleChanged(event: Event) {
    const inputElem = event.target as HTMLInputElement;
    if (inputElem && activeCards[currentCard]) {
        activeCards[currentCard]._rule = inputElem.value;
        updatePreview();
    }
}

function onFluffChanged(event: Event) {
    const inputElem = event.target as HTMLInputElement;
    if (inputElem && activeCards[currentCard]) {
        activeCards[currentCard]._fluff = inputElem.value;
        updatePreview();
    }
}

function onValueChanged(event: Event) {
    const inputElem = event.target as HTMLInputElement;
    if (inputElem && activeCards[currentCard]) {
        activeCards[currentCard]._value = inputElem.value;
        updatePreview();
    }
}

function onPreviousCard() {
    currentCard = Math.max(currentCard - 1, 0);
    updateCardUI();
    updatePreview();
}

function onNextCard() {
    currentCard = Math.min(currentCard + 1, activeCards.length - 1);
    updateCardUI();
    updatePreview();
}

function mmToInches(mm: number): number {
    return mm / 25.4;
}

function handleCreate() {
    if (activeCards[currentCard]) {
        const cardSizeMm = [63, 88];

        let dpi = 300;
        let marginMm = 0;
        const outputDPIInput = document.getElementById('outputdpi') as HTMLInputElement;
        if (outputDPIInput) dpi = parseInt(outputDPIInput.value);
        const outputMargin = document.getElementById('outputmargin') as HTMLInputElement;
        if (outputMargin) marginMm = parseInt(outputMargin.value);
        // Round margin up to that is always at least the requested size.
        let marginPx = Math.ceil(mmToInches(marginMm) * dpi);
        //console.log("Margin Px" + marginPx);

        let canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.width = Math.round(mmToInches(cardSizeMm[0]) * dpi) + 2 * marginPx;
        canvas.height = Math.round(mmToInches(cardSizeMm[1]) * dpi) + 2 * marginPx;

        //console.log("Saved cavas size: " + canvas.width + ", " + canvas.height);

        activeCards[currentCard].draw(canvas, marginPx);

        let link = document.createElement('a');
        link.download = 'stratagem.png';
        link.href = canvas.toDataURL("image/png");
        link.click();

        console.log("Current card: " + currentCard + " Num active cards: " + activeCards.length);
        // Refresh the previewed card.
        updateCardUI();
        updatePreview();
    }
}

function getFileExtension(filename: string): string {
    const substrings = filename.split('.');
    if (substrings.length > 1) {
        return substrings[substrings.length - 1].toLowerCase();
    }
    return "";
}

function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files) {
        currentCard = 0;
        activeCards.length = 0;

        // files is a FileList of File objects. List some properties.
        let output = [];
        for (let f of files) {

            const fileExt = getFileExtension(f.name);
            if (fileExt === "csv" || fileExt === 'tsv') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    // Create a list of cards, make the first card active.
                    const re = e.target;
                    if (re && re.result) {
                        let sourceData = re.result;

                        // Skip encoding tag
                        const csvdatastart = sourceData.toString().indexOf(',') + 1;
                        const csvdata = window.atob(sourceData.toString().slice(csvdatastart));
                        const csvarray = csvdata.split(/\r?\n/g);

                        let cardType = CardType.Stratagem;
                        for (let c of csvarray) {
                            const fields = c.split(fileExt === 'csv' ? ',' : '\t');

                            if (fields.length > 1) {
                                // field[0] -> type
                                console.log("Type: " + fields[0]);
                                if (fields[0].toUpperCase() == "STRATAGEM") cardType = CardType.Stratagem;
                                else if (fields[0].toUpperCase() === "PSYCHIC POWER") cardType = CardType.PsychicPower;
                                else if (fields[0].toUpperCase() === "TACTICAL OBJECTIVE") cardType = CardType.TacticalObjective;
                                else if (fields[0].toUpperCase() === "PRAYER") cardType = CardType.Prayer;
                                else {
                                    // Unknown card type!
                                    // TOOD: Improve error handling.
                                    $('#errorText').html('Unknown card type: ' + fields[0] + '.  Supported card types are ' +
                                        'STRATAGEM, PSYCHIC POWER, PRAYER and TACTICAL OBJECTIVE.');
                                    $('#errorDialog').modal();
                                }

                                // TODO: parse based on card type.
                                if (cardType == CardType.Prayer) {
                                    if (fields.length == 5) {
                                        let card = new Card();
                                        card._type = cardType;
                                        card._value = "";
                                        card._title = fields[1];
                                        card._heading = fields[2];
                                        card._fluff = fields[3];
                                        card._rule = fields[4];
                                        activeCards.push(card);
                                    }
                                }
                                else {
                                    if (fields.length == 6) {
                                        let card = new Card();
                                        card._type = cardType;
                                        card._value = fields[1];
                                        card._title = fields[2];
                                        card._heading = fields[3];
                                        card._fluff = fields[4];
                                        card._rule = fields[5];
                                        activeCards.push(card);
                                    }
                                }
                            }
                        }
                        currentCard = 0;
                        console.log("Num active cards: " + activeCards.length);
                        updateCardUI();
                        updatePreview();
                    }
                }
                reader.readAsDataURL(f);
            }
            else {
                $('#errorText').html('StrataGen only supports .csv files.  Selected file is a \'' + fileExt + "\' file.");
                $('#errorDialog').modal();
            }
        }
    }
}

function onSaveCard() {
    localStorage.setItem('lastCard', JSON.stringify(serialize(activeCards[currentCard])));
}

function onLoadCard() {
    let lastCardString = localStorage.getItem('lastCard');
    if (lastCardString) {
        activeCards[currentCard] = deserialize<Card>(JSON.parse(lastCardString), Card);
        updateCardUI();
        updatePreview();
    }
    else {
        console.log("Card not loaded.");
    }
}

function updateCardUI() {
    if (activeCards[currentCard]) {
        $('#cardtype').val(activeCards[currentCard]._type.toString());
        $('#cardheader').val(activeCards[currentCard]._heading);
        $('#cardtitle').val(activeCards[currentCard]._title);
        $('#cardrule').val(activeCards[currentCard]._rule);
        $('#cardfluff').val(activeCards[currentCard]._fluff);

        if (activeCards[currentCard]._type === CardType.Stratagem) {
            $('#cardvalue').attr({"min": 1, "max": 3});
            if (parseInt(activeCards[currentCard]._value) > 3) activeCards[currentCard]._value = "3";
            else if (parseInt(activeCards[currentCard]._value) < 1) activeCards[currentCard]._value = "1";

            $('#cardvaluelabel').html("Command Points");
            $('#cardvaluecontrol').show();
        }
        else if (activeCards[currentCard]._type === CardType.PsychicPower) {
            $('#cardvalue').attr({"min": 2, "max": 12});
            if (parseInt(activeCards[currentCard]._value) > 12) activeCards[currentCard]._value = "12";
            else if (parseInt(activeCards[currentCard]._value) < 2) activeCards[currentCard]._value = "2";

            $('#cardvaluelabel').html("Warp Charge");
            $('#cardvaluecontrol').show();
        }
        else if (activeCards[currentCard]._type === CardType.TacticalObjective) {
            $('#cardvalue').attr({"min": 11, "max": 66});
            if (parseInt(activeCards[currentCard]._value) > 66) activeCards[currentCard]._value = "66";
            else if (parseInt(activeCards[currentCard]._value) < 11) activeCards[currentCard]._value = "11";
            
            $('#cardvaluelabel').html("Objective (D66)");            
            $('#cardvaluecontrol').show();
        }
        else if (activeCards[currentCard]._type === CardType.Prayer) {
            $('#cardvaluecontrol').hide();
        }

        $('#cardvalue').val(activeCards[currentCard]._value);
    }
}

function plumbCallbacks() {

    $('#previouscard').click(onPreviousCard);
    $('#nextcard').click(onNextCard);

    $('#cardtype').on('change', onCardTypeChanged);
    $('#cardstyle').on('change', onCardStyleChanged);
    $('#cardheader').on('input', onHeaderChanged);
    $('#cardtitle').on('input', onTitleChanged);
    $('#cardrule').on('input', onRuleChanged);
    $('#cardfluff').on('input', onFluffChanged);
    $('#cardvalue').on('input', onValueChanged);
    $('#createcard').click(handleCreate);
    $('#datacardfile').on('change', handleFileSelect);

    $('#savecard').click(onSaveCard);
    $('#loadcard').click(onLoadCard);
}

console.log("Reloading web page.");

let canvas = document.getElementById('preview') as HTMLCanvasElement;
if (canvas) {
    let ctx = canvas.getContext('2d');
    if (ctx) {
        if (activeCards.length == 0) {
            currentCard = 0;
            activeCards[currentCard] = new Card();
        }
    }
}

plumbCallbacks();

updatePreview();

