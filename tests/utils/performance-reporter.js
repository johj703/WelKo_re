class WelKoPerformanceReporter {
  constructor() {
    this.testTimes = new Map();
    this.componentRenderTimes = new Map();
    this.startTime = 0;
  }

  onRunStart() {
    this.startTime = Date.now();
    console.log('\n🚀 WelKo 메인페이지 성능 테스트 시작\n');
  }

  onTestResult(test, testResult) {
    const filename = test.path.split('/').pop();
    const duration = testResult.perfStats.end - testResult.perfStats.start;

    this.testTimes.set(filename, duration);

    // WelKo 메인 페이지 특화 로깅
    if (filename.includes('page.test')) {
      console.log(`📱 메인페이지 테스트: ${duration}ms`);

      if (duration > 2000) {
        console.warn(`⚠️  메인페이지 테스트가 느립니다: ${duration}ms`);
      }
    }
  }

  onRunComplete(contexts, results) {
    const totalTime = Date.now() - this.startTime;

    console.log('\n📊 WelKo 성능 요약:');
    console.log('='.repeat(50));
    console.log(`총 실행 시간: ${totalTime}ms`);
    console.log(`총 테스트 수: ${results.numTotalTests}`);

    // 메인페이지 관련 성능 분석
    const mainPageTests = Array.from(this.testTimes.entries()).filter(([file]) => file.includes('page.test'));

    if (mainPageTests.length > 0) {
      console.log('\n🏠 메인페이지 성능:');
      mainPageTests.forEach(([file, time]) => {
        console.log(`- ${file}: ${time}ms`);
      });
    }

    // 성능 기준 체크
    this.checkPerformanceThresholds(results, totalTime);
  }

  checkPerformanceThresholds(results, totalTime) {
    console.log('\n⚡ 성능 기준 체크:');

    const avgTestTime = totalTime / results.numTotalTests;

    if (avgTestTime > 1000) {
      console.log('❌ 평균 테스트 시간이 1초를 초과했습니다.');
    } else {
      console.log('✅ 평균 테스트 시간이 적절합니다.');
    }

    if (totalTime > 30000) {
      console.log('❌ 전체 테스트 시간이 30초를 초과했습니다.');
    } else {
      console.log('✅ 전체 테스트 시간이 적절합니다.');
    }
  }
}
