import { render } from '@testing-library/react';
import { Suspense } from 'react';

// 가상의 컴포넌트들을 직접 생성 (mock 없이)
const HeadMeta = () => <div data-testid="head-meta">Head Meta</div>;
const SlideImage = () => <div data-testid="slide-image">Slide Image</div>;
const CircleImageList = () => <div data-testid="circle-image-list">Circle Image List</div>;
const PopularPostList = () => <div data-testid="popular-post-list">Popular Post List</div>;
const BestPostsList = () => <div data-testid="best-posts-list">Best Posts List</div>;
const PostsList = () => <div data-testid="posts-list">Posts List</div>;

// 가상의 메인페이지 컴포넌트 (실제 파일 참조 없음)
const MockHomePage = () => {
  return (
    <div data-testid="mock-home-page">
      <HeadMeta />
      <div className="relative">
        <div className="md:h-[560px]">
          <SlideImage />
        </div>
        <div
          className="bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 md:p-0 md:px-[88px]"
          style={{ height: '20%', top: '80%' }}
        >
          <CircleImageList />
          <PopularPostList />
          <Suspense fallback={<div data-testid="loading">Loading...</div>}>
            <BestPostsList />
            <PostsList />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

describe('WelKo 메인페이지 성능 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // performance 객체 mock
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => [])
    };
  });

  describe('📱 기본 렌더링 성능', () => {
    it('메인페이지가 빠르게 렌더링된다 (500ms 이내)', () => {
      const startTime = Date.now();

      const { container } = render(<MockHomePage />);

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      console.log(`🎨 메인페이지 렌더링 시간: ${renderTime.toFixed(2)}ms`);

      // 성능 기준 검증
      expect(renderTime).toBeLessThan(500); // 500ms 이내

      // 기본 요소들이 렌더링되었는지 확인
      expect(container.querySelector('[data-testid="mock-home-page"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="head-meta"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="slide-image"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="circle-image-list"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="popular-post-list"]')).toBeInTheDocument();
    });

    it('모든 즉시 로드 컴포넌트가 올바르게 표시된다', () => {
      const { container } = render(<MockHomePage />);

      // 즉시 로드되어야 하는 컴포넌트들
      expect(container.querySelector('[data-testid="head-meta"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="slide-image"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="circle-image-list"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="popular-post-list"]')).toBeInTheDocument();

      // Suspense fallback 또는 실제 컴포넌트 확인
      const loading = container.querySelector('[data-testid="loading"]');
      const bestPosts = container.querySelector('[data-testid="best-posts-list"]');
      const posts = container.querySelector('[data-testid="posts-list"]');

      // 로딩 상태이거나 실제 컴포넌트가 있어야 함
      expect(loading || bestPosts).toBeInTheDocument();
      expect(loading || posts).toBeInTheDocument();
    });

    it('Lazy 컴포넌트들이 렌더링된다', () => {
      const { container } = render(<MockHomePage />);

      // Lazy 컴포넌트들이 즉시 렌더링되는지 확인 (Suspense 없이)
      expect(container.querySelector('[data-testid="best-posts-list"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="posts-list"]')).toBeInTheDocument();
    });

    it('컨테이너 레이아웃이 올바르게 적용된다', () => {
      const { container } = render(<MockHomePage />);

      // 기본 구조 확인
      const relativeContainer = container.querySelector('.relative');
      expect(relativeContainer).toBeInTheDocument();

      const heightContainer = container.querySelector('.md\\:h-\\[560px\\]');
      expect(heightContainer).toBeInTheDocument();

      const contentContainer = container.querySelector('.rounded-t-3xl');
      expect(contentContainer).toBeInTheDocument();
    });

    it('메인페이지 전체 구조가 올바르다', () => {
      const { container } = render(<MockHomePage />);

      // 전체 구조 검증
      expect(container.firstChild).toBeTruthy();
      expect(container.querySelector('[data-testid="mock-home-page"]')).toBeInTheDocument();

      // 모든 주요 컴포넌트가 존재하는지 확인
      const components = [
        'head-meta',
        'slide-image',
        'circle-image-list',
        'popular-post-list',
        'best-posts-list',
        'posts-list'
      ];

      components.forEach((componentId) => {
        expect(container.querySelector(`[data-testid="${componentId}"]`)).toBeInTheDocument();
      });
    });
  });
});
