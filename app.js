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
    try {
        return guser || (await fs.readFile('~/.holaa-user')).toString()
    } catch (error) {
        const user = await prompt('Enter username> ')
        fs.writeFile('~/.holaa-user', user)
        return user
    }
}

const main = async () => {
    const user = await getUser()

    socket.emit('join', { user, channel })

    socket.on('message', (data) => {
        for (const { user, content } of data) {
            console.log(`${user}> ${content}`)
        }
    })

    while (true) {
        const content = await prompt(`${user}> `)
        socket.emit('message', { content })
    }
}

main().catch(console.error)
