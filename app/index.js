const API_URL = 'http://localhost:3000';
let counter = 0

async function consumeAPI(signal) {
    const response = await fetch(API_URL, {
        signal
    })
    const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(paserNDJSON())
    // .pipeTo(new WritableStream({
    //     write(chunk) {
    //         console.log(++counter, 'chunk', chunk);
    //     }
    // }))

    return reader
}

function appendToHtml(element) {
    return new WritableStream({
        write({title, description, url_anime}){
            const card = `
            <article>
                <div class="text">
                    <h3>[${++counter}]${title}</h3>
                    <p>${description.slice(0, 100)}</p>
                    <a href="${url_anime}"> Here's why</a>
                </div>
            </article>
            `
            element.innerHTML += card
        },
        abort(reason){
            console.log("aborted**", resizeBy)
        }
    })
}

// esse função vai se certificar que caso dois chunks cheguem em uma única transmissão
// converte corretamente para JSON
function paserNDJSON() {
    let ndjsonBuffer = ''
    return new TransformStream({
        transform(chunk, controller) {
            ndjsonBuffer += chunk
            const itens = ndjsonBuffer.split('\n')
            itens.slice(0, -1)
                .forEach(item => controller.enqueue(JSON.parse(item)))
            ndjsonBuffer = itens[itens.length - 1]
        },
        flush(controller){
            if(!ndjsonBuffer) return;

            controller.enqueue(JSON.parse(ndjsonBuffer))
        }
    })
}
const [
    start, 
    stop,
    cards
] = ['start', 'stop', 'cards'].map(item => document.getElementById(item))

let abortController = new AbortController();

start.addEventListener('click', async () => {
    const readable = await consumeAPI(abortController.signal);
    readable.pipeTo(appendToHtml(cards)) 
})

stop.addEventListener('click', () => {
    abortController.abort()
    console.log('aborting...')
})