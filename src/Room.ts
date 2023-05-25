import { Server, Socket } from 'socket.io'
import { Events, Player } from './types'
import RoomManager from './RoomManager'

class Room {
	private _players: Map<string, Player> = new Map()
	private _letters: Map<string, string> = new Map()

	constructor(private _io: Server, private _id: string, private _crosswordId: string) {}

	private _subscribeToEvents(player: Player) {
		player.socket.on('letter', ({ position, letter }: Events.Letter) => {
			const prev = this._letters.get(position)
			if (prev === letter) return
			this._letters.set(position, letter)
			player.socket.broadcast.to(this._id).emit('letter', { position, letter })
		})
	}

	private _initPlayer(player: Player) {
		player.socket.emit('init', {
			positions: Object.fromEntries(this._letters.entries()),
			crosswordId: this._crosswordId
		})
	}

	public connect(player: Player) {
		const existingPlayer = this._players.get(player.id)
		if (existingPlayer) {
			existingPlayer.socket = player.socket
		} else {
			this._players.set(player.id, player)
		}
		player.socket.join(this._id)
		this._subscribeToEvents(player)
		this._initPlayer(player)
	}

	public disconnect(player: Player) {
		console.log('Player disconnected:', player.name)
		player.socket.leave(this._id)
		this._players.delete(player.id)

		if (this._players.size === 0) {
			console.log('Room deleted:', this._id)
			RoomManager.delete(this._id)
		}
	}

	public cleanup() {
		Array.from(this._players.values()).forEach((player) => this.disconnect(player))
	}
}

export default Room
