'use client';

import React from 'react';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
    {
        name: "Sarah Kim",
        role: "Product Designer",
        content: "LifeCraft helped me rediscover my passion. The Enneagram insights were spot on!",
        rating: 5
    },
    {
        name: "David Park",
        role: "Software Engineer",
        content: "I was feeling stuck in my career. The SWOT analysis gave me a clear roadmap forward.",
        rating: 5
    },
    {
        name: "Emily Chen",
        role: "Marketing Manager",
        content: "The values discovery module was eye-opening. I finally understand why I was unhappy in my last job.",
        rating: 5
    },
    {
        name: "Michael Lee",
        role: "Entrepreneur",
        content: "Using LifeCraft to define my vision was a game changer for my business strategy.",
        rating: 5
    },
    {
        name: "Jessica Wu",
        role: "Student",
        content: "A must-have tool for anyone figuring out their career path. Highly recommended!",
        rating: 5
    }
];

export const Testimonials: React.FC = () => {
    return (
        <section className="py-20 overflow-hidden bg-gradient-to-b from-transparent to-white/20">
            <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 font-outfit">What Our Users Say</h3>
                <p className="text-gray-600">Join thousands of others discovering their potential</p>
            </div>

            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex gap-8 py-4">
                    {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="glass-card p-6 rounded-2xl w-80 flex-shrink-0 hover:scale-105 transition-transform duration-300"
                        >
                            <div className="flex gap-1 mb-3">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-700 mb-4 whitespace-normal text-sm leading-relaxed">
                                "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Duplicate for seamless loop */}
                <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-8 py-4">
                    {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
                        <div
                            key={`dup-${idx}`}
                            className="glass-card p-6 rounded-2xl w-80 flex-shrink-0 hover:scale-105 transition-transform duration-300"
                        >
                            <div className="flex gap-1 mb-3">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-700 mb-4 whitespace-normal text-sm leading-relaxed">
                                "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
