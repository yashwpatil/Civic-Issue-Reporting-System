'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categoryLabels } from '@/lib/utils-civic';
import { Trash2, MapPin, Droplet, Zap } from 'lucide-react';

const categories = [
  {
    key: 'garbage' as const,
    icon: <Trash2 className="h-8 w-8" />, 
    description: 'Report overflowing bins or littered areas',
  },
  {
    key: 'roads' as const,
    icon: <MapPin className="h-8 w-8" />,
    description: 'Report potholes, broken roads, or traffic issues',
  },
  {
    key: 'water' as const,
    icon: <Droplet className="h-8 w-8" />,
    description: 'Report water leaks, pipe bursts, or drainage problems',
  },
  {
    key: 'electricity' as const,
    icon: <Zap className="h-8 w-8" />,
    description: 'Report broken streetlights or electrical issues',
  },
];

export function CategoriesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category.key}
          href={`/report?category=${category.key}`}
        >
          <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer">
            <CardHeader>
              <div className="text-primary mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">{category.icon}</div>
              <CardTitle className="text-lg">{categoryLabels[category.key]}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {category.description}
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
