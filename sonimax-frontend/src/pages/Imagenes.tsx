import React from 'react';
import ImageGallery from '../components/ImageGallery';
import { Image } from 'lucide-react';

const Imagenes: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Image className="w-8 h-8 text-blue-600" />
              Galeria de Imagenes
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona y visualiza todas las imagenes de tus proyectos
            </p>
          </div>
        </div>
      </div>

      <ImageGallery showUpload={false} />
    </div>
  );
};

export default Imagenes;
