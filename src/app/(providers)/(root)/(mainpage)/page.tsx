'use client';

import HeadMeta from '@/components/common/Header/HeadMeta';
import CircleImageList from './_components/home/CircleImageList';
import SlideImage from './_components/home/SlideImage';
import { lazy, Suspense } from 'react';
import PopularPostList from './_components/home/PopularPostList';

const BestPostsList = lazy(() => import('./_components/home/BestPostsList'));
const PostsList = lazy(() => import('./_components/PostsList'));

export default function Home() {
  return (
    <>
      <HeadMeta />
      <div className="relative" data-testid="main-page">
        <div className="md:h-[560px]" data-testid="slide-section">
          <SlideImage />
        </div>
        <div
          className="bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 md:p-0 md:px-[88px]"
          style={{ height: '20%', top: '80%' }}
          data-testid="content-section"
        >
          <div data-testid="circle-image-section">
            <CircleImageList />
          </div>
          <div data-testid="popular-posts-section">
            <PopularPostList />
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <div data-testid="best-posts-section">
              <BestPostsList />
            </div>
            <div data-testid="posts-list-section">
              <PostsList />
            </div>
          </Suspense>
        </div>
      </div>
    </>
  );
}
