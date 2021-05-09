import ComponentsBuilder from "./components.js"
import { constants } from "./constants.js"

export default class TerminalController{
    
    #userCollors = new Map()
    
    contructor(){}

    #pickCollor(){
        return `#${((1 << 24) * Math.random() | 0 ).toString(16)}-fg`
    }

    #getUserCollor(userName){
        if(this.#userCollors.has(userName))
            return this.#userCollors.get(userName)

        const collor = this.#pickCollor()

        this.#userCollors.set(userName, collor)

        return collor
    }


    #onInputRecieved(eventEmitter){
        return function(){
            const message = this.getValue()
            eventEmitter.emit(constants.events.app.MESSAGE_SENT, message)
            this.clearValue()
        }
    }

    #onMessageReceived({screen, chat}){
        return msg => {
            const {userName, message} = msg;
            const collor = this.#getUserCollor(userName)
            chat.addItem(`{${collor}}{bold}${userName}{/}: ${message}`)
            screen.render()
        }
    }

    #onLogChange({screen, activityLog}){
        return msg => {
            const [userName] = msg.split(/\s/)
            const collor = this.#getUserCollor(userName)
            activityLog.addItem(`{${collor}}{bold}${userName} ${msg.toString()}{/}`)

            screen.render()
        }
    }

    #onStatusChange({screen, status}){
        return users => {

            //vamos pegar o primeiro elemento da lista
            const {content} = status.items.shift()
            status.clearItems()
            status.addItem(content)
            
            users.forEach(userName => {
                const collor = this.#getUserCollor(userName)
                status.addItem(`{${collor}}{bold}${userName}{/}`)

            });
                
            screen.render()
        }
    }

    #registerEvents(eventEmitter, components){
        eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components))
        eventEmitter.on(constants.events.app.ACTIVITY_UPDATED, this.#onLogChange(components))
        eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusChange(components))
    }

    async initializeTable(eventEmitter){
        const components = new ComponentsBuilder()
              .setScreen({title: 'NodeJS Chat'})
              .setLayoutComponent()
              .setInputComponent(this.#onInputRecieved(eventEmitter))
              .setChatComponent()
              .setActivityLogComponent()
              .setStatusComponent()
              .build()

        this.#registerEvents(eventEmitter, components)

        components.input.focus()
        components.screen.render()

    }
}