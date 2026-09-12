import { SignIn } from "@clerk/nextjs";
import {
  CalendarCheck2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 text-white">
      {/* LADO ESQUERDO: APRESENTAÇÃO DO APLICATIVO */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-16 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* LOGO E NOME DA APLICAÇÃO */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">
            <CalendarCheck2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Gestão de Escalas
          </span>
        </div>

        {/* MENSAGEM PRINCIPAL & RECURSOS */}
        <div className="my-10 lg:my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gestão Ministerial & Voluntários</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Organize as escalas do seu culto sem complicação.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Escale seus voluntários em segundos, notifique direto no WhatsApp e
            receba confirmações de presença instantâneas.
          </p>

          {/* LISTA DE BENEFÍCIOS */}
          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-indigo-400 shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Notificações via WhatsApp
                </h3>
                <p className="text-xs text-slate-400">
                  Dispare os dados do culto e o link de confirmação diretamente
                  para o voluntário.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-indigo-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Confirmação Ágil
                </h3>
                <p className="text-xs text-slate-400">
                  Seu time confirma a presença sem precisar criar conta ou fazer
                  login.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ DA APRESENTAÇÃO */}
        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} Gestão de Escalas. Todos os direitos
          reservados.
        </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO DO CLERK */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-950">
        <div className="w-full max-w-md flex justify-center">
          <SignIn
            path="/sign-in"
            routing="path"
            appearance={{
              elements: {
                card: "bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl w-full",
                headerTitle: "text-white font-bold text-xl",
                headerSubtitle: "text-slate-400 text-sm",
                formButtonPrimary:
                  "bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20",
                formFieldLabel: "text-slate-300 font-medium text-xs",
                formFieldInput:
                  "bg-slate-800 border-slate-700 text-white rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
                footerActionLink:
                  "text-indigo-400 hover:text-indigo-300 font-medium",
                identityPreviewText: "text-slate-300",
                dividerLine: "bg-slate-800",
                dividerText: "text-slate-500 text-xs",
                socialButtonsBlockButton:
                  "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl",
                socialButtonsBlockButtonText: "font-medium text-xs",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
