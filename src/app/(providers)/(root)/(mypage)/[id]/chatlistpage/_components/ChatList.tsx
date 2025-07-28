import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_POST_DETAILS, API_MYPAGE_PROFILE } from '@/utils/apiConstants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { chatService, type Message, type Chat } from '@/services/chatService';
import axios from 'axios';

type ChatListProps = {
  userId: string;
};

type Post = {
  id: string;
  title: string;
  image: string;
};

type User = {
  id: string;
  name: string;
  avatar: string;
};

const fetchPostDetails = async (postId: string): Promise<Post> => {
  const response = await axios.get(API_POST_DETAILS(postId));
  return response.data;
};

const fetchUserDetails = async (userId: string): Promise<User> => {
  const response = await axios.get(API_MYPAGE_PROFILE(userId));
  return response.data;
};

const ChatList = ({ userId }: ChatListProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [newMessages, setNewMessages] = useState<{ [key: string]: boolean }>({});

  // 채팅 데이터 쿼리
  const { data: chatData = [], error: chatError, isLoading } = useQuery<Message[]>({
    queryKey: ['chatList', userId],
    queryFn: async () => {
      try {
        const response = await chatService.fetchChatList(userId);
        return response.data;
      } catch (error) {
        console.error('채팅 목록 조회 중 오류 발생:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // chatData를 기반으로 groupedChats 계산
  const groupedChats = useMemo(() => {
    // 메시지들을 시간순으로 정렬
    const sortedMessages = [...(chatData as Message[])].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sortedMessages.reduce((acc: { [key: string]: Chat }, message: Message) => {
      const chatId = `${message.post_id}-${[message.sender_id, message.receiver_id].sort().join('-')}`;
      if (!acc[chatId]) {
        acc[chatId] = {
          post_id: message.post_id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          messages: []
        };
      }
      acc[chatId].messages = [...acc[chatId].messages, message].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return acc;
    }, {});
  }, [chatData]);

  // postIds와 userIds를 groupedChats에서 계산
  const { postIds, userIds } = useMemo(() => {
    const posts = new Set<string>();
    const users = new Set<string>();

    Object.values(groupedChats).forEach((chat) => {
      posts.add(chat.post_id);
      users.add(chat.sender_id);
      users.add(chat.receiver_id);
    });

    return {
      postIds: Array.from(posts),
      userIds: Array.from(users)
    };
  }, [groupedChats]);

  // 게시물 데이터 쿼리
  const { data: postData = [], error: postError } = useQuery<Post[]>({
    queryKey: ['postDetails', postIds],
    queryFn: async () => {
      if (postIds.length === 0) return [];
      return Promise.all(postIds.map((postId) => fetchPostDetails(postId)));
    },
    enabled: postIds.length > 0,
    staleTime: 0
  });

  // 사용자 데이터 쿼리
  const { data: userData = [], error: userError } = useQuery<User[]>({
    queryKey: ['userDetails', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      return Promise.all(userIds.map((id) => fetchUserDetails(id)));
    },
    enabled: userIds.length > 0,
    staleTime: 0
  });

  // 실시간 업데이트 로직
  useEffect(() => {
    const unsubscribeCallbacks: (() => void)[] = [];

    // 각 채팅방별로 구독 설정
    Object.entries(groupedChats).forEach(([chatId, chat]) => {
      const unsubscribe = chatService.subscribeToRoomList(chat.post_id, userId, {
        onMessage: (message: Message) => {
          try {
            // 새 메시지가 현재 사용자가 보낸 것이 아닐 때만 알림 상태 업데이트
            if (message.sender_id !== userId && !message.is_checked) {
              setNewMessages(prev => ({
                ...prev,
                [chatId]: false
              }));
            }

            // 채팅 목록 데이터 업데이트
            queryClient.setQueryData(['chatList', userId], (oldData: Message[] | undefined) => {
              if (!oldData) return [message];
              const existingIndex = oldData.findIndex(msg => msg.id === message.id);
              if (existingIndex !== -1) {
                const newData = [...oldData];
                newData[existingIndex] = message;
                return newData;
              }
              return [message, ...oldData];
            });
          } catch (error) {
            console.error('새 메시지 처리 중 오류 발생:', error);
          }
        },
        onError: (error: any) => console.error('실시간 구독 오류:', error)
      });
      unsubscribeCallbacks.push(unsubscribe);
    });

    // 컴포넌트 언마운트 시 모든 구독 해제
    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, queryClient, groupedChats]);

  const handleChatClick = async (chat: Chat) => {
    try {
      const receiverId = userId === chat.sender_id ? chat.receiver_id : chat.sender_id;
      const postDetails = postData?.find((post) => post.id === chat.post_id);
      const chatId = `${chat.post_id}-${[chat.sender_id, chat.receiver_id].sort().join('-')}`;

      // 메시지 읽음 상태 업데이트
      await chatService.markMessagesAsRead(chat.messages, userId);

      // 새 메시지 알림 상태 즉시 업데이트
      setNewMessages(prev => ({
        ...prev,
        [chatId]: true
      }));

      // URL 인코딩 처리
      const encodedTitle = encodeURIComponent(postDetails?.title || '');
      const encodedImage = encodeURIComponent(postDetails?.image || '');

      // 페이지 이동
      router.push(
        `/${userId}/${receiverId}/chatpage?postId=${chat.post_id}&postTitle=${encodedTitle}&postImage=${encodedImage}`
      );
    } catch (error) {
      console.error('채팅방 이동 중 오류 발생:', error);
      const receiverId = userId === chat.sender_id ? chat.receiver_id : chat.sender_id;
      router.push(`/${userId}/${receiverId}/chatpage?postId=${chat.post_id}`);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[calc(100vh-400px)] items-center justify-center">Loading...</div>;
  }

  if (chatError || postError || userError) {
    return <div className="flex min-h-[calc(100vh-400px)] items-center justify-center">Error loading data</div>;
  }

  if (!chatData || (chatData as Message[]).length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-400px)] items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-[8px]">
          <Image src="/icons/Group-348.svg" alt="no chat" width={44} height={44} />
          <p className="text-[14px] font-semibold text-grayscale-900">You don&apos;t have any messages</p>
          <p className="text-[12px] text-grayscale-600">When you receive a new message,</p>
          <p className="text-[12px] text-grayscale-600">it will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(groupedChats).map(([chatId, chat]: [string, Chat]) => {
        const postDetails = postData?.find((post) => post.id === chat.post_id);
        const receiverId = userId === chat.sender_id ? chat.receiver_id : chat.sender_id;
        const senderDetails = userData?.find((user) => user.id === receiverId);
        const isNewMessage =
          !newMessages[chatId] && chat.messages[0]?.sender_id !== userId && !chat.messages[0]?.is_checked;

        if (!postDetails || !senderDetails) return null;

        return (
          <div
            key={chatId}
            className="mb-[32px]"
            onClick={() => handleChatClick(chat)}
          >
            <div className="flex">
              <Image
                className="rounded-[8px]"
                src={postDetails.image || '/icons/upload.png'}
                alt={postDetails.title || 'Default name'}
                width={64}
                height={64}
                style={{ width: '64px', height: '64px' }}
              />
              <div className="ml-[8px] flex w-full flex-col gap-[5px]">
                <div className="flex items-center justify-between">
                  <p className="line-clamp-1 text-[13px] font-medium text-primary-900">{postDetails.title}</p>
                  <p className="ml-[8px] flex-shrink-0 text-[10px] text-grayscale-500">
                    {chatService.formatDate(chat.messages[0]?.created_at)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-grayscale-900">{chat.messages[0]?.content}</p>
                  {isNewMessage && <span className="h-[8px] w-[8px] rounded-full bg-action-color"></span>}
                </div>
                <div className="flex">
                  <Image
                    className="items-center rounded-full"
                    src={senderDetails.avatar || '/icons/upload.png'}
                    alt={senderDetails.name || 'Default name'}
                    width={16}
                    height={16}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <p className="ml-[4px] text-[10px] text-grayscale-500">{senderDetails.name}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;