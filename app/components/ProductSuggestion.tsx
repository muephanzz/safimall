import React from "react";
import { Button } from "@/components/ui/button";

const ProductSuggestion: React.FC = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[80%] bg-gray-100 rounded-lg p-3 rounded-tl-none">
        <p className="font-semibold">Looking for something like this?</p>
        <div className="mt-2 bg-white rounded-md p-2 border">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0">
              <img 
                src="https://placehold.co/100x100/e6e6e6/7f7f7f.png?text=Product" 
                alt="Suggested product" 
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">Premium Wireless Headphones</h4>
              <p className="text-green-600 text-sm font-semibold">$89.99</p>
              <div className="mt-1">
                <Button size="sm" className="h-7 text-xs bg-primary text-white hover:bg-primary/90 w-full">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestion;
