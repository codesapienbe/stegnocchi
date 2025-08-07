import { logInfo, logError, Component } from '../core/logger';

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: number;
  permissions: string[];
}

export interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  owner: string;
  participants: CollaborationUser[];
  maxParticipants: number;
  isPrivate: boolean;
  createdAt: number;
  lastActivity: number;
  status: 'active' | 'paused' | 'ended';
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CollaborationConfig {
  enabled: boolean;
  enableRealTime: boolean;
  enableFileSharing: boolean;
  enableScreenSharing: boolean;
  enableVoiceChat: boolean;
  maxParticipants: number;
  messageRetention: number; // milliseconds
  heartbeatInterval: number; // milliseconds
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'message_sent' | 'file_shared' | 'session_updated' | 'permission_changed';
  sessionId: string;
  userId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Real-time collaboration utility for collaborative features
 */
export class RealTimeCollaboration {
  private config: CollaborationConfig;
  private sessions: Map<string, CollaborationSession> = new Map();
  private messages: Map<string, CollaborationMessage[]> = new Map();
  private users: Map<string, CollaborationUser> = new Map();
  private eventListeners: Map<string, Array<(event: CollaborationEvent) => void>> = new Map();
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CollaborationConfig>) {
    this.config = {
      enabled: true,
      enableRealTime: true,
      enableFileSharing: true,
      enableScreenSharing: false,
      enableVoiceChat: false,
      maxParticipants: 10,
      messageRetention: 24 * 60 * 60 * 1000, // 24 hours
      heartbeatInterval: 30000, // 30 seconds
      ...config,
    };

    if (this.config.enableRealTime) {
      this.startHeartbeat();
    }
  }

  /**
   * Create collaboration session
   */
  createSession(
    name: string,
    description: string,
    owner: string,
    isPrivate: boolean = false
  ): string {
    if (!this.config.enabled) {
      throw new Error('Collaboration is disabled');
    }

    const sessionId = `session-${Date.now()}-${Math.random()}`;
    const ownerUser = this.users.get(owner);
    
    if (!ownerUser) {
      throw new Error('Owner user not found');
    }

    const session: CollaborationSession = {
      id: sessionId,
      name,
      description,
      owner,
      participants: [ownerUser],
      maxParticipants: this.config.maxParticipants,
      isPrivate,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);

    logInfo(Component.UI, 'Collaboration session created', {
      sessionId,
      name,
      owner,
      isPrivate,
    });

    return sessionId;
  }

  /**
   * Join collaboration session
   */
  joinSession(sessionId: string, userId: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const session = this.sessions.get(sessionId);
    const user = this.users.get(userId);
    
    if (!session || !user) {
      return false;
    }

    if (session.participants.length >= session.maxParticipants) {
      logError(Component.UI, 'Session is full', { sessionId, userId });
      return false;
    }

    if (session.participants.some(p => p.id === userId)) {
      logInfo(Component.UI, 'User already in session', { sessionId, userId });
      return true;
    }

    session.participants.push(user);
    session.lastActivity = Date.now();

    this.emitEvent({
      type: 'user_joined',
      sessionId,
      userId,
      data: { user },
      timestamp: Date.now(),
    });

    logInfo(Component.UI, 'User joined session', {
      sessionId,
      userId,
      userName: user.name,
    });

    return true;
  }

  /**
   * Leave collaboration session
   */
  leaveSession(sessionId: string, userId: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const participantIndex = session.participants.findIndex(p => p.id === userId);
    if (participantIndex === -1) {
      return false;
    }

    const user = session.participants[participantIndex];
    session.participants.splice(participantIndex, 1);
    session.lastActivity = Date.now();

    this.emitEvent({
      type: 'user_left',
      sessionId,
      userId,
      data: { user },
      timestamp: Date.now(),
    });

    logInfo(Component.UI, 'User left session', {
      sessionId,
      userId,
      userName: user.name,
    });

    // End session if no participants left
    if (session.participants.length === 0) {
      this.endSession(sessionId);
    }

    return true;
  }

  /**
   * Send message to session
   */
  sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    type: CollaborationMessage['type'] = 'text',
    metadata?: Record<string, any>
  ): string {
    if (!this.config.enabled) {
      throw new Error('Collaboration is disabled');
    }

    const session = this.sessions.get(sessionId);
    const user = this.users.get(userId);
    
    if (!session || !user) {
      throw new Error('Session or user not found');
    }

    if (!session.participants.some(p => p.id === userId)) {
      throw new Error('User not in session');
    }

    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const message: CollaborationMessage = {
      id: messageId,
      sessionId,
      userId,
      type,
      content,
      timestamp: Date.now(),
      metadata,
    };

    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    session.lastActivity = Date.now();

    this.emitEvent({
      type: 'message_sent',
      sessionId,
      userId,
      data: { message },
      timestamp: Date.now(),
    });

    logInfo(Component.UI, 'Message sent', {
      sessionId,
      userId,
      messageId,
      type,
      contentLength: content.length,
    });

    return messageId;
  }

  /**
   * Share file in session
   */
  async shareFile(
    sessionId: string,
    userId: string,
    fileName: string,
    fileData: ArrayBuffer,
    fileType: string
  ): Promise<string> {
    if (!this.config.enableFileSharing) {
      throw new Error('File sharing is disabled');
    }

    const metadata = {
      fileName,
      fileType,
      fileSize: fileData.byteLength,
      sharedAt: Date.now(),
    };

    // Convert file data to base64 for message content
    const base64Data = Buffer.from(fileData).toString('base64');
    
    return this.sendMessage(sessionId, userId, base64Data, 'file', metadata);
  }

  /**
   * Get session messages
   */
  getSessionMessages(sessionId: string, limit: number = 50): CollaborationMessage[] {
    const messages = this.messages.get(sessionId) || [];
    return messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .reverse();
  }

  /**
   * Get session participants
   */
  getSessionParticipants(sessionId: string): CollaborationUser[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.participants] : [];
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): CollaborationSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.participants.some(p => p.id === userId))
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: CollaborationUser['status']): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.status = status;
    user.lastSeen = Date.now();

    logInfo(Component.UI, 'User status updated', {
      userId,
      status,
    });

    return true;
  }

  /**
   * Add user to system
   */
  addUser(user: CollaborationUser): void {
    this.users.set(user.id, user);
    
    logInfo(Component.UI, 'User added to collaboration system', {
      userId: user.id,
      userName: user.name,
      status: user.status,
    });
  }

  /**
   * Remove user from system
   */
  removeUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // Remove user from all sessions
    for (const session of this.sessions.values()) {
      this.leaveSession(session.id, userId);
    }

    this.users.delete(userId);
    
    logInfo(Component.UI, 'User removed from collaboration system', {
      userId,
      userName: user.name,
    });

    return true;
  }

  /**
   * End collaboration session
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'ended';
    session.lastActivity = Date.now();

    // Remove all participants
    session.participants = [];

    this.emitEvent({
      type: 'session_updated',
      sessionId,
      data: { status: 'ended' },
      timestamp: Date.now(),
    });

    logInfo(Component.UI, 'Collaboration session ended', {
      sessionId,
      sessionName: session.name,
    });

    return true;
  }

  /**
   * Add event listener
   */
  addEventListener(sessionId: string, listener: (event: CollaborationEvent) => void): void {
    if (!this.eventListeners.has(sessionId)) {
      this.eventListeners.set(sessionId, []);
    }
    
    this.eventListeners.get(sessionId)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(sessionId: string, listener: (event: CollaborationEvent) => void): boolean {
    const listeners = this.eventListeners.get(sessionId);
    if (!listeners) {
      return false;
    }

    const index = listeners.indexOf(listener);
    if (index === -1) {
      return false;
    }

    listeners.splice(index, 1);
    return true;
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: CollaborationEvent): void {
    const listeners = this.eventListeners.get(event.sessionId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logError(Component.UI, 'Event listener error', { error });
        }
      });
    }
  }

  /**
   * Start heartbeat for real-time updates
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Perform heartbeat
   */
  private performHeartbeat(): void {
    const now = Date.now();
    
    // Update user last seen times
    for (const user of this.users.values()) {
      if (user.status === 'online') {
        user.lastSeen = now;
      }
    }

    // Clean up old messages
    for (const [sessionId, messages] of this.messages.entries()) {
      const cutoffTime = now - this.config.messageRetention;
      const filteredMessages = messages.filter(msg => msg.timestamp > cutoffTime);
      
      if (filteredMessages.length !== messages.length) {
        this.messages.set(sessionId, filteredMessages);
        
        logInfo(Component.UI, 'Old messages cleaned up', {
          sessionId,
          removedCount: messages.length - filteredMessages.length,
        });
      }
    }
  }

  /**
   * Get collaboration statistics
   */
  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    totalUsers: number;
    onlineUsers: number;
    totalMessages: number;
  } {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active').length;
    const totalUsers = this.users.size;
    const onlineUsers = Array.from(this.users.values()).filter(u => u.status === 'online').length;
    const totalMessages = Array.from(this.messages.values()).reduce((sum, messages) => sum + messages.length, 0);

    return {
      totalSessions,
      activeSessions,
      totalUsers,
      onlineUsers,
      totalMessages,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CollaborationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableRealTime && !this.heartbeatTimer) {
      this.startHeartbeat();
    } else if (!this.config.enableRealTime && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    
    logInfo(Component.UI, 'Collaboration config updated', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const realTimeCollaboration = new RealTimeCollaboration(); 