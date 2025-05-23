import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';

export default function SobreNosotros({ auth }) {
    const Layout = auth.user ? AuthenticatedLayout : GuestLayout;

    return (
        <Layout>
            <Head title="Sobre Nosotros - LoopZ" />

            <main className='pt-20 text-white'>
                <section className="container mx-auto px-6 py-20 md:py-28 text-center flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 opacity-10">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-900 rounded-full filter blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-900 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 relative z-10">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">Sobre LoopZ</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl relative z-10">
                        Descubre la esencia de LoopZ: una comunidad vibrante donde la música evoluciona contigo.
                    </p>
                </section>

                <section className="py-16 bg-gray-800">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">
                            ¿Qué es LoopZ?
                        </h2>
                        <div className="max-w-4xl mx-auto text-gray-300 space-y-6 text-lg">
                            <p>
                                LoopZ es una aplicación interactiva diseñada para revolucionar la forma en que artistas y oyentes interactúan con la música. En nuestra plataforma, tanto artistas como oyentes tienen el mismo nivel de participación en la creación y exploración musical.
                            </p>
                            <p>
                                Los usuarios pueden subir sus propias canciones, compartirlas con la comunidad y, lo más importante, hacer remix de sus temas favoritos. Te invitamos a experimentar con nuevos sonidos y colaborar activamente en la creación de música innovadora.
                            </p>
                            <p>
                                LoopZ va más allá de ser una simple plataforma de streaming; es un ecosistema dinámico donde la música está en constante evolución. Esta transformación se impulsa a través de la creatividad desbordante y la interacción activa dentro de nuestra comunidad. Fomentamos la colaboración y el intercambio creativo, creando un espacio donde todos participan en la evolución musical.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-16">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">
                            Nuestros Objetivos
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
                                <h3 className="text-xl font-semibold text-blue-400 mb-3">Descubrimiento Musical</h3>
                                <p className="text-gray-300">
                                    Facilitar el descubrimiento de nuevas canciones y artistas emergentes, ayudándote a encontrar tu próxima banda sonora.
                                </p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
                                <h3 className="text-xl font-semibold text-pink-500 mb-3">Comunidad Colaborativa</h3>
                                <p className="text-gray-300">
                                    Crear y nutrir una comunidad activa y colaborativa donde la música sea el lenguaje universal que nos une.
                                </p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
                                <h3 className="text-xl font-semibold text-blue-400 mb-3">Experiencia Personalizada</h3>
                                <p className="text-gray-300">
                                    Brindar una experiencia musical única y personalizada, adaptada a tus gustos. Esto incluye una innovadora cola automática de canciones generada por IA para una reproducción fluida y adaptada.
                                </p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl transform hover:scale-105 transition-transform duration-300">
                                <h3 className="text-xl font-semibold text-pink-500 mb-3">Compartir Fácilmente</h3>
                                <p className="text-gray-300">
                                    Proporcionar una forma sencilla y directa de compartir tus canciones favoritas y creaciones con el mundo.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 text-center">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold mb-6 text-white">Únete a la Revolución Musical</h2>
                        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
                            LoopZ es más que música; es movimiento, colaboración y descubrimiento constante. ¿Estás listo para ser parte de ello?
                        </p>
                        <Link
                            href={auth.user ? route('biblioteca') : route('register')}
                            className="px-10 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-300 ease-in-out"
                        >
                            {auth.user ? 'Explora tu Biblioteca' : 'Comienza Ahora'}
                        </Link>
                    </div>
                </section>
            </main>
        </Layout>
    );
}
