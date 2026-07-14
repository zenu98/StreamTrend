import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-30">
      <div className="mx-auto px-4 md:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-white">
            StreamTrend Beta v0.3
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-white/50">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>xenu98@naver.com</span>
            </div>
            <span className="cursor-default text-white/30">디스코드</span>
            <span className="cursor-default text-white/30">Github</span>
          </div>
        </div>

        <div className="mt-6  pt-6">
          <p className="text-xs leading-relaxed text-white/30">
            StreamTrend는 치지직에 공개된 방송 데이터를 수집·집계하여 보여주는
            비공식 서비스입니다. 회원가입이나 로그인 없이 이용할 수 있으며,
            별도로 개인정보를 수집하지 않습니다.
          </p>

          <p className="text-xs leading-relaxed text-white/30">
            표시되는 게임/스트리머명, 이미지 등은 각 권리자에게 귀속되며,
            StreamTrend는 정보 제공 목적으로만 이를 사용합니다. 수집된 데이터의
            정확성은 보장되지 않으며, 실제 치지직 수치와 오차가 있을 수
            있습니다.
          </p>
          <p className="text-xs text-white/30">
            © 2026 StreamTrend. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
