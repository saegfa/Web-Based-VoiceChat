import { Radio, Plus, LogIn } from 'lucide-react';

interface HomeProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function Home({ onCreateRoom, onJoinRoom }: HomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-6 rounded-full shadow-2xl">
              <Radio className="w-16 h-16 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            Sesli Sohbet Odası
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Anında bir oda oluşturun veya mevcut bir odaya katılın. Arkadaşlarınızla gerçek zamanlı sesli iletişim kurun.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={onCreateRoom}
            className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Oda Oluştur</h2>
            <p className="text-slate-400 mb-4">
              Yeni bir sesli sohbet odası oluşturun ve arkadaşlarınızı davet edin
            </p>

            <div className="inline-flex items-center gap-2 text-cyan-400 font-semibold">
              Yeni Oda Oluştur
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={onJoinRoom}
            className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:scale-105"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 rounded-full group-hover:scale-110 transition-transform">
                <LogIn className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Odaya Katıl</h2>
            <p className="text-slate-400 mb-4">
              Oda kodunu kullanarak mevcut bir sohbet odasına katılın
            </p>

            <div className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
              Odaya Katıl
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-slate-800/30 rounded-xl p-6 inline-block">
            <h3 className="text-white font-semibold mb-2">Nasıl Çalışır?</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">1</div>
                <span>Oda Oluştur</span>
              </div>
              <div className="text-slate-600">→</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">2</div>
                <span>Kodu Paylaş</span>
              </div>
              <div className="text-slate-600">→</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">3</div>
                <span>Konuş</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
