import Room from './Room'
import RoomManager from './RoomManager'
import io from './io'
import { Events } from './types'

const timeoutMap: Record<string, NodeJS.Timeout> = {}

io.on('connection', (socket) => {
	socket.once('create_room', ({ roomId, crosswordId }) => {
		console.log('Room created:', roomId, crosswordId)
		const room = new Room(io, roomId, crosswordId)
		RoomManager.set(roomId, room)
		timeoutMap[roomId] = setTimeout(() => {
			room.cleanup()
			RoomManager.delete(roomId)
		}, 10000)
	})

	socket.once('join_room', ({ roomId, player }: Events.Connect, cb) => {
		console.log('Player join:', player.id, '- to room:', roomId)

		player.socket = socket
		socket.once('disconnect', () => {
			console.log('Timeout started for player', player.id)
			timeoutMap[player.id] = setTimeout(() => room?.disconnect(player), 10000)
		})

		if (roomId in timeoutMap) {
			clearTimeout(timeoutMap[roomId])
		}
		if (player.id in timeoutMap) {
			clearTimeout(timeoutMap[player.id])
		}

		let room = RoomManager.get(roomId)
		if (!room) {
			console.log('Room does not exist:', roomId)
			return cb(false)
		}

		room.connect(player)
		cb(true)
	})
})
