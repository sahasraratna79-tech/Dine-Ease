/** Unsplash photo IDs are mapped centrally so dish images and alt text stay aligned. */
const image = (photoId: string, alt: string) => ({
  src: photoId.startsWith('https://') ? photoId : `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=82`,
  alt,
});

export const foodImages: Record<string, { src: string; alt: string }> = {
  idly: image('photo-1741376509253-221ac18fac0f', 'Idli served with sambar and chutney'),
  'masala-dosa': image('photo-1743615467204-8fdaa85ff2db', 'Golden masala dosa with South Indian sides'),
  'plain-dosa': image('photo-1668236543090-82eba5ee5976', 'Crisp golden dosa served on a plate'),
  uttapam: image('photo-1630383249896-424e482df921', 'Savory Indian pancake topped with vegetables'),
  'paneer-tikka': image('https://images.pexels.com/photos/33430556/pexels-photo-33430556/free-photo-of-grilled-paneer-tikka-with-spices-and-sauces.jpeg?auto=compress&cs=tinysrgb&w=900', 'Grilled paneer tikka with chutneys, spices, and herbs'),
  'chicken-tikka': image('photo-1755090154782-5215189b4083', 'Chicken tikka skewers served in a cast iron pan'),
  samosa: image('photo-1772729996007-40bad08b3c40', 'Golden fried samosas served on a white napkin'),
  chole: image('photo-1626132647523-66f5bf380027', 'Chole chickpea curry served with bhature'),
  'butter-chicken': image('photo-1603894584373-5ac82b2ae398', 'Butter chicken curry in a traditional bowl'),
  'dal-makhani': image('photo-1788601988466-9f361c34c6cb', 'Rich Indian lentil curry with rice'),
  'veg-biryani': image('photo-1563379091339-03246963d51a', 'Fragrant vegetable biryani with basmati rice'),
  'chicken-biryani': image('photo-1559528896-c5310744cce8', 'Bowl of chicken biryani with basmati rice'),
  'mango-lassi': image('photo-1546173159-315724a31696', 'Chilled mango yogurt smoothie'),
  'masala-chai': image('photo-1571934811356-5cc061b6821f', 'Freshly brewed tea in a cup'),
  'gulab-jamun': image('photo-1593701461250-d7b22dfd3a77', 'Homemade gulab jamun Indian sweets'),
  brownie: image('photo-1606313564200-e75d5e30476c', 'Rich chocolate brownie dessert'),
  'lime-soda': image('photo-1513558161293-cdaf765edfd47', 'Fresh citrus drink with lime'),
};

export function FoodPhoto({ itemId, className = '' }: { itemId: string; className?: string }) {
  const food = foodImages[itemId];
  return (
    <div className={`food-photo-frame ${className}`}>
      {food ? <img src={food.src} alt={food.alt} loading={className.includes('hero') ? 'eager' : 'lazy'} onError={event => {
        event.currentTarget.hidden = true;
      }} /> : <span className="food-photo-fallback" aria-hidden="true" />}
      <span className="food-photo-fallback" aria-hidden="true" />
    </div>
  );
}

