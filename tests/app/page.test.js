import { render, screen, waitFor, act } from '@testing-library/react';
import { Suspense } from 'react';
import Home from '@/app/(providers)/(root)/(mainpage)/page';

// 컴포넌트 mocks
jest.mock('@/components/common/Header/HeadMeta', () => {
  return function HeadMeta() {
    return <div data-testid="head-meta">Head Meta</div>;
  };
});

jest.mock('@/app/(providers)/(root)/(mainpage)/_components/home/SlideImage', () => {
  return function SlideImage() {
    return <div data-testid="slide-image">Slide Image Component</div>;
  };
});

jest.mock('@/app/(providers)/(root)/(mainpage)/_components/home/CircleImageList', () => {
  return function CircleImageList() {
    return <div data-testid="circle-image-list">Circle Image List</div>;
  };
});

jest.mock('@/app/(providers)/(root)/(mainpage)/_components/home/PopularPostList', () => {
  return function PopularPostList() {
    return <div data-testid="popular-post-list">Popular Post List</div>;
  };
});

// Lazy 컴포넌트들 mock
jest.mock('@/app/(providers)/(root)/(mainpage)/_components/home/BestPostsList', () => {
  return function BestPostsList() {
    return <div data-testid="best-posts-list">Best Posts List</div>;
  };
});

jest.mock('@/app/(providers)/(root)/(mainpage)/_components/PostsList', () => {
  return function PostsList() {
    return <div data-testid="posts-list">Posts List</div>;
  };
});

describe('WelKo 메인페이지 성능 테스트', () => {
  // 각 테스트 전에 성능 측정 초기화
  beforeEach(() => {
    jest.clearAllMocks();
    performance.mark = jest.fn();
    performance.measure = jest.fn();
    performance.now = jest.fn(() => Date.now());
  });

  describe('📱 기본 렌더링 성능', () => {
    it('메인페이지가 빠르게 렌더링된다 (500ms 이내)', async () => {
      const startTime = performance.now();
      performance.mark('mainpage-render-start');

      const { container } = render(<Home />);

      performance.mark('mainpage-render-end');
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`🎨 메인페이지 렌더링 시간: ${renderTime.toFixed(2)}ms`);

      // 성능 기준 검증
      expect(renderTime).toBeLessThan(500); // 500ms 이내

      // 기본 요소들이 렌더링되었는지 확인
      expect(screen.getByTestId('head-meta')).toBeInTheDocument();
      expect(screen.getByTestId('slide-image')).toBeInTheDocument();
      expect(screen.getByTestId('circle-image-list')).toBeInTheDocument();
      expect(screen.getByTestId('popular-post-list')).toBeInTheDocument();
    });

    it('모든 즉시 로드 컴포넌트가 올바르게 표시된다', () => {
      render(<Home />);

      // 즉시 로드되어야 하는 컴포넌트들
      expect(screen.getByTestId('head-meta')).toBeInTheDocument();
      expect(screen.getByTestId('slide-image')).toBeInTheDocument();
      expect(screen.getByTestId('circle-image-list')).toBeInTheDocument();
      expect(screen.getByTestId('popular-post-list')).toBeInTheDocument();

      // Suspense fallback이 표시되는지 확인
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('⚡ Lazy Loading 성능', () => {
    it('Lazy 컴포넌트들이 적절한 시간 내에 로드된다', async () => {
      const lazyLoadStart = performance.now();

      render(<Home />);

      // 처음엔 Loading... 표시
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Lazy 컴포넌트들이 로드될 때까지 대기
      await waitFor(
        () => {
          expect(screen.getByTestId('best-posts-list')).toBeInTheDocument();
          expect(screen.getByTestId('posts-list')).toBeInTheDocument();
        },
        { timeout: 3000 } // 3초 내에 로드되어야 함
      );

      const lazyLoadEnd = performance.now();
      const lazyLoadTime = lazyLoadEnd - lazyLoadStart;

      console.log(`🔄 Lazy 컴포넌트 로딩 시간: ${lazyLoadTime.toFixed(2)}ms`);

      // Lazy loading 성능 검증
      expect(lazyLoadTime).toBeLessThan(2000); // 2초 이내

      // Loading fallback이 사라졌는지 확인
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('Suspense boundary가 올바르게 동작한다', async () => {
      render(<Home />);

      // 초기 상태: fallback 표시
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('best-posts-list')).not.toBeInTheDocument();
      expect(screen.queryByTestId('posts-list')).not.toBeInTheDocument();

      // 로드 완료 후: 실제 컴포넌트 표시
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByTestId('best-posts-list')).toBeInTheDocument();
        expect(screen.getByTestId('posts-list')).toBeInTheDocument();
      });
    });
  });

  describe('🎯 레이아웃 성능', () => {
    it('반응형 레이아웃이 올바르게 적용된다', () => {
      // 모바일 뷰포트
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { container } = render(<Home />);

      // 슬라이드 이미지 컨테이너 확인
      const slideContainer = container.querySelector('.md\\:h-\\[560px\\]');
      expect(slideContainer).toBeInTheDocument();

      // 콘텐츠 컨테이너 확인
      const contentContainer = container.querySelector('.rounded-t-3xl');
      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toHaveClass('p-4', 'md:p-0', 'md:px-[88px]');
    });

    it('스타일이 성능에 영향을 주지 않는다', () => {
      const styleStart = performance.now();

      const { container } = render(<Home />);

      // 모든 스타일 클래스가 적용되었는지 확인
      const elements = container.querySelectorAll('*');
      elements.forEach((element) => {
        // 스타일 계산 강제 실행 (reflow 트리거)
        window.getComputedStyle(element);
      });

      const styleEnd = performance.now();
      const styleTime = styleEnd - styleStart;

      console.log(`🎨 스타일 계산 시간: ${styleTime.toFixed(2)}ms`);

      // 스타일 계산이 100ms 이내에 완료되어야 함
      expect(styleTime).toBeLessThan(100);
    });
  });

  describe('🚀 전체 페이지 로드 성능', () => {
    it('전체 페이지가 3초 이내에 완전히 로드된다', async () => {
      const pageLoadStart = performance.now();

      render(<Home />);

      // 모든 컴포넌트가 로드될 때까지 대기
      await waitFor(
        () => {
          // 즉시 로드 컴포넌트들
          expect(screen.getByTestId('head-meta')).toBeInTheDocument();
          expect(screen.getByTestId('slide-image')).toBeInTheDocument();
          expect(screen.getByTestId('circle-image-list')).toBeInTheDocument();
          expect(screen.getByTestId('popular-post-list')).toBeInTheDocument();

          // Lazy 로드 컴포넌트들
          expect(screen.getByTestId('best-posts-list')).toBeInTheDocument();
          expect(screen.getByTestId('posts-list')).toBeInTheDocument();

          // Loading 상태가 없어야 함
          expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const pageLoadEnd = performance.now();
      const totalLoadTime = pageLoadEnd - pageLoadStart;

      console.log(`📱 전체 페이지 로드 시간: ${totalLoadTime.toFixed(2)}ms`);

      // 전체 로드 시간이 3초 이내여야 함
      expect(totalLoadTime).toBeLessThan(3000);

      // 성능 등급 매기기
      if (totalLoadTime < 1000) {
        console.log('🏆 성능 등급: 우수 (1초 미만)');
      } else if (totalLoadTime < 2000) {
        console.log('🥇 성능 등급: 좋음 (2초 미만)');
      } else {
        console.log('🥈 성능 등급: 보통 (3초 미만)');
      }
    });
  });

  describe('🔧 메모리 사용량 테스트', () => {
    it('메모리 누수 없이 렌더링된다', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // 여러 번 렌더링하여 메모리 누수 확인
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<Home />);

        await waitFor(() => {
          expect(screen.getByTestId('best-posts-list')).toBeInTheDocument();
        });

        unmount();
      }

      // 강제 가비지 컬렉션 (개발 환경에서만)
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      if (performance.memory) {
        console.log(`💾 메모리 증가량: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

        // 메모리 증가가 50MB 미만이어야 함
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });

  describe('📱 사용자 경험 테스트', () => {
    it('로딩 상태에서 사용자가 기다리는 시간이 적절하다', async () => {
      render(<Home />);

      // 즉시 보여지는 콘텐츠들이 있는지 확인
      expect(screen.getByTestId('slide-image')).toBeInTheDocument();
      expect(screen.getByTestId('circle-image-list')).toBeInTheDocument();
      expect(screen.getByTestId('popular-post-list')).toBeInTheDocument();

      // 로딩 인디케이터가 있는지 확인
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // 로딩이 완료되면 모든 콘텐츠가 표시되는지 확인
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByTestId('best-posts-list')).toBeInTheDocument();
        expect(screen.getByTestId('posts-list')).toBeInTheDocument();
      });
    });
  });
});
