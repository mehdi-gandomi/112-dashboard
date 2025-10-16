import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const BackToTopButton: React.FC = () => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsVisible(window.scrollY > 400);
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<button
			onClick={scrollToTop}
			title="بازگشت به بالا"
			aria-label="بازگشت به بالا"
			className={`fixed bottom-6 right-6 z-50 transition-opacity duration-300 ${
				isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
			} bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center`}
		>
			<ChevronUp className="w-6 h-6" />
		</button>
	);
};

export default BackToTopButton;


