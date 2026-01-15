const clients = new Set<NodeJS.WritableStream>();

export function addSseClient(response: NodeJS.WritableStream)
{
    clients.add(response);
}

export function removeSseClient(response: NodeJS.WritableStream)
{
    clients.delete(response);
}

export function broadcastSseEvent(data: unknown)
{
    const payload = `data: ${JSON.stringify(data)}\n\n`;

    for (const client of clients)
    {
        client.write(payload);
    }
}