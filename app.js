const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs/promises')
const readline = require('node:readline')
const io = require('socket.io-client')

const channel = process.argv[2]
const guser = process.argv[3]

const socket = io('http://103.147.34.87:8000', {
    transports: ['websocket'],
    path: '/holaa/socket.io',
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const prompt = async (label, falback) => {
    const response = (await new Promise((resolve) => rl.question(label, resolve))) || falback

    if (response === undefined) {
        return await prompt(label)
    }

    return response
}

const getUser = async () => {
    let user = guser

    if (!user) {
        try {
            user = (await fs.readFile(path.join(os.homedir(), '.holaa-user'))).toString()
        } catch (error) {
            do {
                user = await prompt('Enter username (/^[a-zA-Z0-9_-]{5,12}$/) > ')
            } while (!/^[a-zA-Z0-9_-]{5,12}$/.test(user))

            fs.writeFile(path.join(os.homedir(), '.holaa-user'), user)
        }
    }

    return user.padEnd(12, ' ')
}

const main = async () => {
    const user = await getUser()

    socket.emit('join', { user, channel })

    socket.on('message', (data) => {
        process.stdout.write('\r\x1b[K')

        for (const { user, content } of data) {
            console.log(`${user}> ${content}`)
        }

        rl.prompt()
    })

    while (true) {
        const content = await prompt(`${user}> `)
        socket.emit('message', { content })
    }
}

main().catch(console.error)
