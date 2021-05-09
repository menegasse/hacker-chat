import { constants } from "./constants.js"

export default class EventManager{

    #allUsers = new Map()

    constructor({componentEmitter, socketClient}){
        this.componentEmitter = componentEmitter
        this.socketClient = socketClient
    }

    joinRoomAnWaitForMessages(data){
        this.socketClient.sendMessage(constants.events.socket.JOIN_ROOM, data)

        this.componentEmitter.on(constants.events.app.MESSAGE_SENT, msg => {
            this.socketClient.sendMessage(constants.events.socket.MESSAGE, msg)
        })
    }

    updateUsers(users){
        const connectUsers = users
        connectUsers.forEach(({ id, userName}) => this.#allUsers.set(id, userName))
        this.#updateUsersComponent()
    }

    disconectUser(user){
        const {userName, id} = user
        this.#allUsers.delete(id)


        this.#updateActivityLogComponent(` ${ userName } left!`)
        this.#updateUsersComponent()
    }

    newUserConnected(message){
        const {id, userName} = message
        this.#allUsers.set(id, userName)
        this.#updateUsersComponent()
        this.#updateActivityLogComponent(` ${userName} joined!`)
    }

    message(message){
        this.componentEmitter.emit(
            constants.events.app.MESSAGE_RECEIVED,
            message
        )
    }

    #updateActivityLogComponent(message){
        this.componentEmitter.emit(
            constants.events.app.ACTIVITY_UPDATED,
            message
        )
    }

    #updateUsersComponent(){
        this.componentEmitter.emit(
            constants.events.app.STATUS_UPDATED,
            Array.from(this.#allUsers.values())
        )
    }

    getEvents(){
        const functions = Reflect.ownKeys(EventManager.prototype)
                                 .filter(fn => fn !== 'constructor')
                                 .map( name => [name, this[name].bind(this)])
        return new Map(functions)
    }
}