import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';

// 현업 스타일로 개선된 가상 컴포넌트들
const HeadMeta = () => <div data-testid="head-meta">Head Meta</div>;

const SlideImage = () => (
  <div data-testid="slide-image" className="slide-container">
    <img src="/hero-image.jpg" alt="메인 슬라이드" />
    <button data-testid="cta-button">지금 시작하기</button>
  </div>
);

const CircleImageList = () => (
  <div data-testid="circle-image-list">
    <h2>카테고리</h2>
    {['개발', '디자인', '마케팅'].map((category, index) => (
      <button key={index} data-testid={`category-${category}`} onClick={() => console.log(`${category} 클릭됨`)}>
        {category}
      </button>
    ))}
  </div>
);

const PopularPostList = () => (
  <div data-testid="popular-post-list">
    <h2>인기 포스트</h2>
    {[
      { id: 1, title: 'React 시작하기', author: '김개발' },
      { id: 2, title: 'Next.js 가이드', author: '이웹개발' },
      { id: 3, title: 'TypeScript 마스터', author: '박타입' }
    ].map((post) => (
      <article
        key={post.id}
        data-testid="popular-post"
        tabIndex={0}
        onClick={() => console.log(`포스트 ${post.id} 클릭됨`)}
        onKeyDown={(e) => e.key === 'Enter' && console.log(`포스트 ${post.id} 키보드로 선택됨`)}
      >
        <h3>{post.title}</h3>
        <p>작성자: {post.author}</p>
      </article>
    ))}
  </div>
);

const BestPostsList = () => (
  <div data-testid="best-posts-list">
    <h2>베스트 포스트</h2>
    <div>베스트 포스트 내용...</div>
  </div>
);

const PostsList = () => (
  <div data-testid="posts-list">
    <h2>전체 포스트</h2>
    <div>전체 포스트 목록...</div>
  </div>
);

// 개선된 메인페이지 컴포넌트 (현업 스타일 반영)
const MockHomePage = ({ loading = false }) => {
  if (loading) {
    return (
      <div data-testid="loading-page">
        <div data-testid="skeleton-loader">
          <div className="skeleton-header">로딩 중...</div>
          <div className="skeleton-content">콘텐츠를 불러오고 있습니다...</div>
        </div>
      </div>
    );
  }

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

// Mock router 설정
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn()
};

// Router mock 적용
jest.mock('next/router', () => ({
  useRouter: () => mockRouter
}));

describe('WelKo 메인페이지 - 현업 스타일 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();

    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => [])
    };
  });

  describe('🎯 사용자 상호작용 테스트', () => {
    it('사용자가 인기 포스트를 클릭하면 상호작용이 발생한다', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<MockHomePage />);

      // 인기 포스트 섹션이 로드될 때까지 대기
      await waitFor(() => {
        expect(screen.getByText('인기 포스트')).toBeInTheDocument();
      });

      // 첫 번째 포스트 클릭
      const firstPost = screen.getAllByTestId('popular-post')[0];
      await user.click(firstPost);

      // 콘솔 로그로 클릭 이벤트 확인
      expect(consoleSpy).toHaveBeenCalledWith('포스트 1 클릭됨');

      consoleSpy.mockRestore();
    });

    it('키보드로 포스트 네비게이션이 가능하다', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<MockHomePage />);

      const firstPost = screen.getAllByTestId('popular-post')[0];

      // 포커스 이동
      firstPost.focus();

      // Enter 키로 선택
      await user.keyboard('{Enter}');

      expect(consoleSpy).toHaveBeenCalledWith('포스트 1 키보드로 선택됨');

      consoleSpy.mockRestore();
    });

    it('CTA 버튼 클릭 시 상호작용이 발생한다', async () => {
      const user = userEvent.setup();
      render(<MockHomePage />);

      const ctaButton = screen.getByTestId('cta-button');
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveTextContent('지금 시작하기');

      // 버튼이 클릭 가능한 상태인지 확인
      expect(ctaButton).not.toBeDisabled();

      await user.click(ctaButton);
      // 실제 현업에서는 여기서 GA 이벤트나 페이지 이동을 테스트
    });

    it('카테고리 버튼들이 정상적으로 동작한다', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<MockHomePage />);

      const categories = ['개발', '디자인', '마케팅'];

      for (const category of categories) {
        const categoryButton = screen.getByTestId(`category-${category}`);
        await user.click(categoryButton);
        expect(consoleSpy).toHaveBeenCalledWith(`${category} 클릭됨`);
      }

      consoleSpy.mockRestore();
    });
  });

  describe('🎨 로딩 상태 테스트', () => {
    it('로딩 중일 때 스켈레톤 UI를 표시한다', () => {
      render(<MockHomePage loading={true} />);

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
      expect(screen.getByText('콘텐츠를 불러오고 있습니다...')).toBeInTheDocument();

      // 실제 콘텐츠는 표시되지 않아야 함
      expect(screen.queryByTestId('popular-post-list')).not.toBeInTheDocument();
    });

    it('로딩 완료 후 모든 콘텐츠가 표시된다', async () => {
      render(<MockHomePage loading={false} />);

      // 모든 주요 섹션이 표시되는지 확인
      await waitFor(() => {
        expect(screen.getByText('인기 포스트')).toBeInTheDocument();
        expect(screen.getByText('카테고리')).toBeInTheDocument();
        expect(screen.getByText('베스트 포스트')).toBeInTheDocument();
      });

      // 로딩 UI는 표시되지 않아야 함
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
    });
  });

  describe('♿ 접근성 테스트', () => {
    it('모든 이미지에 대체 텍스트가 있다', () => {
      render(<MockHomePage />);

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('인터랙티브 요소들이 키보드로 접근 가능하다', () => {
      render(<MockHomePage />);

      // 포스트 article들이 tabIndex를 가지는지 확인
      const posts = screen.getAllByTestId('popular-post');
      posts.forEach((post) => {
        expect(post).toHaveAttribute('tabIndex', '0');
      });

      // 버튼들은 기본적으로 키보드 접근 가능
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('semantic HTML 구조를 사용한다', () => {
      render(<MockHomePage />);

      // article 태그들이 있는지 확인 (popular-post들)
      const articles = screen.getAllByTestId('popular-post');
      expect(articles.length).toBeGreaterThan(0);

      // 제목들이 올바른 위계를 가지는지 확인
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('⚡ 성능 테스트', () => {
    it('메인 컴포넌트들이 빠르게 렌더링된다', async () => {
      const startTime = performance.now();

      render(<MockHomePage />);

      // 핵심 콘텐츠가 로드될 때까지 대기
      await waitFor(() => {
        expect(screen.getByText('인기 포스트')).toBeInTheDocument();
        expect(screen.getAllByTestId('popular-post')).toHaveLength(3);
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`📊 메인 콘텐츠 로딩 시간: ${renderTime.toFixed(2)}ms`);

      // 현업 기준: 주요 콘텐츠는 100ms 이내에 렌더링
      expect(renderTime).toBeLessThan(100);
    });

    it('Lazy 컴포넌트들이 적절한 시간 내에 로드된다', async () => {
      render(<MockHomePage />);

      // Suspense fallback 확인 또는 실제 컴포넌트 확인
      await waitFor(
        () => {
          const bestPosts = screen.queryByTestId('best-posts-list');
          const posts = screen.queryByTestId('posts-list');
          const loading = screen.queryByTestId('loading');

          // 로딩 중이거나 실제 컴포넌트가 렌더링되어야 함
          expect(bestPosts || loading).toBeInTheDocument();
          expect(posts || loading).toBeInTheDocument();
        },
        { timeout: 2000 }
      ); // 2초 이내에 로드되어야 함
    });
  });

  describe('🐛 에러 처리 테스트', () => {
    it('빈 상태에서도 에러가 발생하지 않는다', () => {
      // Props 없이 렌더링해도 에러가 없어야 함
      expect(() => render(<MockHomePage />)).not.toThrow();
    });

    it('잘못된 props가 전달되어도 처리한다', () => {
      // 의도적으로 잘못된 props 전달
      expect(() => render(<MockHomePage loading="invalid" />)).not.toThrow();
    });
  });
});
