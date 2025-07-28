import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import axios from 'axios';
import { API_MYPAGE_CHATS } from '@/utils/apiConstants';

const supabase = createClient();

// 채팅방 구독을 관리하는 Map
let chatSubscriptions = new Map<string, RealtimeChannel>();

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  post_id: string;
  is_checked: boolean;
};

export type Chat = {
  post_id: string;
  sender_id: string;
  receiver_id: string;
  messages: Message[];
};

export const chatService = {
  fetchChatList: (userId: string) => {
    return axios.get(API_MYPAGE_CHATS(userId));
  },

  subscribeToChatUpdates: (userId: string, handlers: {
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  }) => {
    const channelName = `chat-updates-${userId}`;

    // 이미 구독 중인 경우 기존 구독 해제
    if (chatSubscriptions.has(channelName)) {
      chatSubscriptions.get(channelName)?.unsubscribe();
      chatSubscriptions.delete(channelName);
    }
    
    const channel = supabase
      .channel(channelName)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .subscribe((status, error) => {
        if (error && handlers.onError) {
          handlers.onError(error);
        }
      });

    // 새로운 구독을 Map에 저장
    chatSubscriptions.set(channelName, channel);

    return () => {
      if (chatSubscriptions.has(channelName)) {
        chatSubscriptions.get(channelName)?.unsubscribe();
        chatSubscriptions.delete(channelName);
      }
    };
  },

  subscribeToRoomList: (postId: string, userId: string, handlers: {
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  }) => {
    const channelName = `chat-room-list-${postId}`;

    // 이미 구독 중인 경우 기존 구독 해제
    if (chatSubscriptions.has(channelName)) {
      chatSubscriptions.get(channelName)?.unsubscribe();
      chatSubscriptions.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .subscribe((status, err) => {
        if (err && handlers.onError) {
          handlers.onError(err);
        }
      });

    chatSubscriptions.set(channelName, channel);

    return () => {
      if (chatSubscriptions.has(channelName)) {
        chatSubscriptions.get(channelName)?.unsubscribe();
        chatSubscriptions.delete(channelName);
      }
    };
  },

  subscribeToRoom: (postId: string, userId: string, handlers: {
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  }) => {
    const channelName = `chat-room-${postId}`;

    // 이미 구독 중인 경우 기존 구독 해제
    if (chatSubscriptions.has(channelName)) {
      chatSubscriptions.get(channelName)?.unsubscribe();
      chatSubscriptions.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .subscribe((status, err) => {
        if (err && handlers.onError) {
          handlers.onError(err);
        }
      });

    chatSubscriptions.set(channelName, channel);

    return () => {
      if (chatSubscriptions.has(channelName)) {
        chatSubscriptions.get(channelName)?.unsubscribe();
        chatSubscriptions.delete(channelName);
      }
    };
  },

  subscribeToListUpdates: (userId: string, handlers: {
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  }) => {
    const channelName = `chat-list-${userId}`;

    if (chatSubscriptions.has(channelName)) {
      chatSubscriptions.get(channelName)?.unsubscribe();
      chatSubscriptions.delete(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        (payload) => {
          if (payload.new && isValidMessage(payload.new)) {
            handlers.onMessage(payload.new as Message);
          }
        }
      )
      .subscribe((status, err) => {
        if (err && handlers.onError) {
          handlers.onError(err);
        }
      });

    chatSubscriptions.set(channelName, channel);

    return () => {
      if (chatSubscriptions.has(channelName)) {
        chatSubscriptions.get(channelName)?.unsubscribe();
        chatSubscriptions.delete(channelName);
      }
    };
  },

  markMessagesAsRead: async (messages: Message[], userId: string) => {
    const unreadMessages = messages.filter(
      msg => msg.receiver_id === userId && !msg.is_checked
    );
    
    if (unreadMessages.length > 0) {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_checked: true })
        .in('id', unreadMessages.map(msg => msg.id))
        .select();

      if (error) {
        console.error('메시지 읽음 상태 업데이트 중 오류:', error);
        return null;
      }

      return data;
    }
    return null;
  },

  formatDate: (created_at: string) => {
    const messageDate = new Date(created_at);
    const today = new Date();

    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();

    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      return `${messageDate.getMonth() + 1}.${messageDate.getDate()}`;
    }
  }
};

export const fetchMessages = async (senderId: string, receiverId: string, postId: string) => {
  // postId가 비어있으면 빈 배열 반환
  if (!postId) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey ( id, name, avatar ),
      receiver:users!messages_receiver_id_fkey ( id, name, avatar )
    `
    )
    .eq('post_id', postId)
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error('메시지 조회 중 오류 발생:', error);
    return [];
  }

  return data;
};

export const sendMessage = async (senderId: string, receiverId: string, content: string, postId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id: senderId, receiver_id: receiverId, content, post_id: postId, is_checked: false }])
    .select();

  if (error) {
    console.error('메시지 전송 중 오류 발생:', error);
    return null;
  }

  return data;
};

// 모든 구독 해제
export const unsubscribeAll = () => {
  chatSubscriptions.forEach((channel) => channel.unsubscribe());
  chatSubscriptions.clear();
};

// 메시지 유효성 검사 헬퍼 함수
const isValidMessage = (message: any): message is Message => {
  return (
    typeof message === 'object' &&
    'id' in message &&
    'sender_id' in message &&
    'receiver_id' in message &&
    'content' in message &&
    'created_at' in message &&
    'post_id' in message &&
    'is_checked' in message
  );
};