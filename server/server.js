// curl -i -X OPTIONS -N localhost:3000
// curl -N localhost:3000

import { createReadStream } from 'fs';
import {createServer} from 'http';
import { Readable, Transform } from 'node:stream';
import { WritableStream, TransformStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises';
import csvtojson from 'csvtojson';

const PORT = 3000;
createServer(async (request, response) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
    }
    if(request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }
    let itens = 0;
    request.once('close', _ => console.log('connection was closed', itens))

    Readable.toWeb(createReadStream('../animeflv/animeflv.csv'))
    // ao passo que cada linha do arquivo seja transformado em um objeto
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(new TransformStream({
        transform(chunk, controller){
            const data = JSON.parse(Buffer.from(chunk));
            const mappedData = {
                title: data.title,
                description: data.description,
                url_anime: data.url_anime
            }
            // quebra de linha pois está no formato NDJSON
            controller.enqueue(JSON.stringify(mappedData).concat('\n'));
        }
    }))
    .pipeTo(new WritableStream({
        async write(chunk) {
            await setTimeout(100);
            itens ++;
            response.write(chunk);
        },
        close() {
            response.end();
        }
    }))
   
    response.writeHead(200, headers);
    // response.end("Ok");
})
.listen(PORT)
.on('listening', _ => console.log(`Server is running at ${PORT}`));