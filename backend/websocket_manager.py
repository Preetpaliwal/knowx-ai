"""
WebSocket Manager for Live Quiz Competitions
Handles real-time communication between host and participants
"""
import socketio
import logging
from typing import Dict, Set, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Create Socket.IO server with CORS enabled
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    logger=False,
    engineio_logger=False
)

# Track connections: competition_id -> set of socket_ids
competition_rooms: Dict[str, Set[str]] = {}
# Track participant sessions: socket_id -> (competition_id, participant_id, is_host)
socket_sessions: Dict[str, tuple] = {}


class CompetitionWebSocketManager:
    """Manages WebSocket connections for live competitions"""

    @staticmethod
    async def join_competition(sid: str, competition_id: str, participant_id: Optional[str], is_host: bool = False):
        """Add a socket to a competition room"""
        room = f"competition_{competition_id}"
        await sio.enter_room(sid, room)
        
        if competition_id not in competition_rooms:
            competition_rooms[competition_id] = set()
        competition_rooms[competition_id].add(sid)
        
        socket_sessions[sid] = (competition_id, participant_id, is_host)
        
        logger.info(f"{'Host' if is_host else 'Participant'} {participant_id} joined competition {competition_id}")

    @staticmethod
    async def leave_competition(sid: str):
        """Remove a socket from a competition room"""
        if sid not in socket_sessions:
            return
        
        competition_id, participant_id, is_host = socket_sessions[sid]
        room = f"competition_{competition_id}"
        
        await sio.leave_room(sid, room)
        
        if competition_id in competition_rooms:
            competition_rooms[competition_id].discard(sid)
            if not competition_rooms[competition_id]:
                del competition_rooms[competition_id]
        
        del socket_sessions[sid]
        
        logger.info(f"{'Host' if is_host else 'Participant'} {participant_id} left competition {competition_id}")

    @staticmethod
    async def broadcast_to_competition(competition_id: str, event: str, data: dict):
        """Broadcast an event to all participants in a competition"""
        room = f"competition_{competition_id}"
        await sio.emit(event, data, room=room)
        logger.debug(f"Broadcasted {event} to competition {competition_id}")

    @staticmethod
    async def emit_to_host(competition_id: str, event: str, data: dict):
        """Emit an event only to the host of a competition"""
        if competition_id not in competition_rooms:
            return
        
        for sid in competition_rooms[competition_id]:
            if sid in socket_sessions:
                _, _, is_host = socket_sessions[sid]
                if is_host:
                    await sio.emit(event, data, room=sid)
                    logger.debug(f"Emitted {event} to host of competition {competition_id}")
                    break

    @staticmethod
    async def emit_to_participant(sid: str, event: str, data: dict):
        """Emit an event to a specific participant"""
        await sio.emit(event, data, room=sid)

    @staticmethod
    def get_competition_participants_count(competition_id: str) -> int:
        """Get the number of connected participants in a competition"""
        if competition_id not in competition_rooms:
            return 0
        return len(competition_rooms[competition_id])

    @staticmethod
    def is_participant_connected(sid: str) -> bool:
        """Check if a participant is still connected"""
        return sid in socket_sessions


ws_manager = CompetitionWebSocketManager()


# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    """Handle new WebSocket connection"""
    logger.info(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """Handle WebSocket disconnection"""
    logger.info(f"Client disconnected: {sid}")
    
    if sid in socket_sessions:
        competition_id, participant_id, is_host = socket_sessions[sid]
        
        # Notify others that this participant disconnected
        if not is_host and participant_id:
            await ws_manager.broadcast_to_competition(
                competition_id,
                "participant_disconnected",
                {
                    "participantId": participant_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        await ws_manager.leave_competition(sid)


@sio.event
async def join_competition_room(sid, data):
    """Handle participant/host joining a competition room"""
    try:
        competition_id = data.get("competitionId")
        participant_id = data.get("participantId")
        is_host = data.get("isHost", False)
        
        if not competition_id:
            await sio.emit("error", {"message": "Competition ID required"}, room=sid)
            return
        
        await ws_manager.join_competition(sid, competition_id, participant_id, is_host)
        
        # Send acknowledgment
        await sio.emit("joined_competition", {
            "competitionId": competition_id,
            "participantId": participant_id,
            "isHost": is_host,
            "timestamp": datetime.utcnow().isoformat()
        }, room=sid)
        
        # Notify others if it's a participant
        if not is_host and participant_id:
            await ws_manager.broadcast_to_competition(
                competition_id,
                "participant_joined",
                {
                    "participantId": participant_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    except Exception as e:
        logger.error(f"Error joining competition room: {e}")
        await sio.emit("error", {"message": str(e)}, room=sid)


@sio.event
async def leave_competition_room(sid, data):
    """Handle participant/host leaving a competition room"""
    try:
        if sid in socket_sessions:
            competition_id, participant_id, is_host = socket_sessions[sid]
            
            if not is_host and participant_id:
                await ws_manager.broadcast_to_competition(
                    competition_id,
                    "participant_left",
                    {
                        "participantId": participant_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            
            await ws_manager.leave_competition(sid)
    
    except Exception as e:
        logger.error(f"Error leaving competition room: {e}")


@sio.event
async def ping(sid, data):
    """Handle ping for connection health check"""
    await sio.emit("pong", {"timestamp": datetime.utcnow().isoformat()}, room=sid)


# Export the Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, socketio_path='/ws/socket.io')
