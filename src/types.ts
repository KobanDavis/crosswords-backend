import { Socket } from 'socket.io'

export interface Player {
	name: string
	id: string
	socket: Socket
}

export namespace Events {
	export interface Connect {
		roomId: string
		player: Player
		crosswordId: string
	}

	export interface Letter {
		position: string
		letter: string
	}
}
