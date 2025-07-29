import '@testing-library/jest-dom';

// Next.js 13+ App Router mocks
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forword: jest.fn(),
            refresh: jest.fn(),
        }
    },
    useSearchParams(){
        return new URLSearchParams()
    },
    usePathname(){
        return '/',
    }
}))

// Next.js Image mock
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        const {src, alt, width, height, ...otherProps} = props
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} width={width} height={height} {...otherProps} />
    }
}))

// Intersection Observer mock (이미지 lazy loading용)
global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
        this.callback = callback
    }
    disconnect() {}
    observer(element) {
        // 즉시 intersecting 상태로 만들어 lazy loading 트리거
        this.callback([{ isIntersecting: true, target: element }])
    }
    unobserve() {}
}

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {}
    disconnect() {}
    observe() {}
    unobserve() {}
}

// 성능 측정을 위한 전역 변수
global.performance = global.performance || {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
}