import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: name,
          clientEmail: email,
          clientPhone: phone,
          message: message,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        setError('Erro ao enviar contato. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setError('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-black text-white py-20" id="contact-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column: Info & humanized imagery */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Fale Conosco</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Pronto para dar o seu <br />
                <span className="text-orange-500">próximo passo?</span>
              </h2>
              <p className="text-gray-400 font-light leading-relaxed">
                Nossa equipe de consultores especializados está pronta para apresentar as melhores opções de investimento ou moradia na capital paulista. Agende uma conversa ou envie suas dúvidas.
              </p>
            </div>

            {/* Direct Channels */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-orange-600/10 p-3 rounded-lg border border-orange-500/20 text-orange-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Telefone e WhatsApp</h4>
                  <p className="text-sm font-semibold text-white mt-1">(11) 3088-4000 • (11) 99999-5555</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-600/10 p-3 rounded-lg border border-orange-500/20 text-orange-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail Corporativo</h4>
                  <p className="text-sm font-semibold text-white mt-1">vendas@imbloco.com.br</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-600/10 p-3 rounded-lg border border-orange-500/20 text-orange-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sede Central da Construtora</h4>
                  <p className="text-sm font-semibold text-white mt-1">Alameda Lorena, 1500 - Jardins, São Paulo/SP</p>
                </div>
              </div>
            </div>

            {/* Humanized image overlay */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video border border-gray-800">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80"
                alt="Consultores da Construtora Imbloco"
                className="w-full h-full object-cover filter brightness-90 transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Nossos corretores</p>
                <p className="text-[10px] text-gray-400 font-light">Atendimento humanizado de alta qualidade</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact interactive Form */}
          <div className="lg:col-span-7 bg-white text-gray-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-black border-b border-gray-100 pb-3.5 mb-6 flex items-center justify-between">
              <span>Formulário de Interesse</span>
              <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">Envio Direto</span>
            </h3>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center space-y-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                  <h4 className="text-lg font-extrabold text-green-800">Contato Enviado com Sucesso!</h4>
                  <p className="text-xs text-green-700 font-light leading-relaxed max-w-md mx-auto">
                    Agradecemos seu interesse na Imbloco Construtora e Imobiliária. Um de nossos especialistas entrará em contato por telefone ou WhatsApp no menor tempo possível.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-black text-white hover:bg-orange-600 text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer transition-colors mt-2"
                  >
                    Enviar Outra Mensagem
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 1 }}
                  onSubmit={handleSubmitContact}
                  className="space-y-4"
                >
                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Seu Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Roberto Carlos de Souza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">E-mail para Retorno</label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: roberto@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">WhatsApp / Celular</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 99999-8888"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Como podemos te ajudar?</label>
                    <textarea
                      required
                      placeholder="Gostaria de agendar uma apresentação de novos lançamentos Imbloco..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs h-32 resize-none focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-400 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Enviando Mensagem...' : 'Enviar Mensagem de Interesse'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
