'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Heart, Target, Briefcase, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface Value {
  id: string;
  name: string;
  description: string;
  category: 'terminal' | 'instrumental' | 'work';
}

interface ValueCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  values: Value[];
}

const initialValues: Value[] = [
  // Terminal Values
  { id: 'tv1', name: 'Family Safety', description: 'Family members being protected from danger and living safely and stably', category: 'terminal' },
  { id: 'tv2', name: 'Personal Growth', description: 'Focusing on self-improvement, learning, and developing one\'s potential', category: 'terminal' },
  { id: 'tv3', name: 'Health and Wellness', description: 'Maintaining a balanced state physically, mentally, and emotionally', category: 'terminal' },
  { id: 'tv4', name: 'Freedom', description: 'Being able to choose and make decisions to live life without external constraints', category: 'terminal' },
  { id: 'tv5', name: 'Financial Freedom', description: 'Having the ability to choose and act on what one wants without worrying about money', category: 'terminal' },
  { id: 'tv6', name: 'Inner Peace', description: 'Obtaining life satisfaction through mental tranquility and emotional balance', category: 'terminal' },
  { id: 'tv7', name: 'Social Justice', description: 'Desiring a fair, equitable, and just society', category: 'terminal' },
  { id: 'tv8', name: 'Authenticity', description: 'Living honestly according to one\'s values and beliefs rather than others\' opinions', category: 'terminal' },
  { id: 'tv9', name: 'Happiness', description: 'Living a life feeling joy and satisfaction daily and living meaningfully', category: 'terminal' },
  { id: 'tv10', name: 'Achievement', description: 'Achieving goals and feeling satisfaction and fulfillment from one\'s efforts', category: 'terminal' },
  { id: 'tv11', name: 'Beautiful World', description: 'Discovering and cherishing aesthetic value in nature, art, and life experiences', category: 'terminal' },
  { id: 'tv12', name: 'Spirituality', description: 'Pursuing connection and belief in transcendent beings or meaning beyond the material world', category: 'terminal' },
  { id: 'tv13', name: 'Wisdom', description: 'Developing sound judgment and insight through experience and learning', category: 'terminal' },
  { id: 'tv14', name: 'True Friendship', description: 'Forming and maintaining deep relationships based on mutual trust and respect', category: 'terminal' },
  { id: 'tv15', name: 'Comfortable Life', description: 'Maintaining a lifestyle with low stress and anxiety, comfort and leisure', category: 'terminal' },

  // Instrumental Values
  { id: 'iv1', name: 'Integrity', description: 'Speaking truth without lies or pretense, being consistent inside and out', category: 'instrumental' },
  { id: 'iv2', name: 'Empathy', description: 'Resonating with others\' emotions and situations and responding appropriately', category: 'instrumental' },
  { id: 'iv3', name: 'Courage', description: 'Choosing right actions even in the face of fear or difficulties', category: 'instrumental' },
  { id: 'iv4', name: 'Responsibility', description: 'Carrying out assigned roles to completion and accepting and managing results', category: 'instrumental' },
  { id: 'iv5', name: 'Open-mindedness', description: 'Accepting new ideas and diverse perspectives, being able to modify one\'s views based on evidence', category: 'instrumental' },
  { id: 'iv6', name: 'Creativity', description: 'Creating fresh ideas and solutions different from existing ones', category: 'instrumental' },
  { id: 'iv7', name: 'Resilience', description: 'Quickly recovering from failure or setbacks and challenging again', category: 'instrumental' },
  { id: 'iv8', name: 'Kindness', description: 'Treating others with warm and considerate hearts', category: 'instrumental' },
  { id: 'iv9', name: 'Discipline', description: 'Maintaining consistent behavior according to certain principles and rules', category: 'instrumental' },
  { id: 'iv10', name: 'Adaptability', description: 'Flexibly adjusting oneself to changing environments', category: 'instrumental' },
  { id: 'iv11', name: 'Humility', description: 'Being humble and having an attitude of learning from others', category: 'instrumental' },
  { id: 'iv12', name: 'Tolerance', description: 'Understanding and accepting different views or behaviors even when uncomfortable', category: 'instrumental' },
  { id: 'iv13', name: 'Ambition', description: 'Having big dreams and making efforts to achieve them', category: 'instrumental' },
  { id: 'iv14', name: 'Cooperation', description: 'Working harmoniously with others to achieve common goals', category: 'instrumental' },
  { id: 'iv15', name: 'Initiative', description: 'Taking the lead and creating opportunities', category: 'instrumental' },

  // Work Values
  { id: 'wv1', name: 'Work-Life Balance', description: 'Being able to maintain harmony between work and personal life', category: 'work' },
  { id: 'wv2', name: 'Autonomy', description: 'Being guaranteed to perform work on one\'s own without excessive interference', category: 'work' },
  { id: 'wv3', name: 'Recognition', description: 'Being able to receive appropriate evaluation and appreciation for one\'s efforts and achievements', category: 'work' },
  { id: 'wv4', name: 'Contribution', description: 'Exerting meaningful influence and adding value through one\'s work', category: 'work' },
  { id: 'wv5', name: 'Challenge', description: 'Being able to test and develop one\'s abilities through difficult tasks', category: 'work' },
  { id: 'wv6', name: 'Professional Development', description: 'Getting learning opportunities to grow as an expert in a specific field', category: 'work' },
  { id: 'wv7', name: 'Teamwork', description: 'Being able to cooperate with colleagues to achieve common goals', category: 'work' },
  { id: 'wv8', name: 'Innovation', description: 'Being able to introduce new methods or technologies to create substantial change', category: 'work' },
  { id: 'wv9', name: 'Job Security', description: 'Being guaranteed a non-dangerous and stable work environment and employment', category: 'work' },
  { id: 'wv10', name: 'Creativity at Work', description: 'Being able to demonstrate free thinking and original ideas', category: 'work' },
  { id: 'wv11', name: 'Fair Compensation', description: 'Receiving appropriate financial rewards for work performed', category: 'work' },
  { id: 'wv12', name: 'Leadership Opportunity', description: 'Having chances to lead and guide others in achieving organizational goals', category: 'work' },
  { id: 'wv13', name: 'Flexibility', description: 'Being able to choose work schedules and locations that fit personal needs', category: 'work' },
  { id: 'wv14', name: 'Ethics', description: 'Working in an environment where moral principles are upheld and ethical behavior is valued', category: 'work' },
  { id: 'wv15', name: 'Variety', description: 'Having diverse tasks and responsibilities to maintain interest and engagement', category: 'work' },
];

const ValuesDiscoveryPage: React.FC = () => {
  const [categories, setCategories] = useState<ValueCategory[]>([
    {
      id: 'very-important',
      title: 'Very Important',
      description: 'Values that are fundamental to who you are',
      color: 'bg-green-50 border-green-200',
      values: []
    },
    {
      id: 'important',
      title: 'Important',
      description: 'Values that matter significantly in your life',
      color: 'bg-blue-50 border-blue-200',
      values: []
    },
    {
      id: 'somewhat-important',
      title: 'Somewhat Important',
      description: 'Values that have some influence on your decisions',
      color: 'bg-yellow-50 border-yellow-200',
      values: []
    },
    {
      id: 'not-important',
      title: 'Not Important',
      description: 'Values that have minimal impact on your choices',
      color: 'bg-gray-50 border-gray-200',
      values: []
    }
  ]);

  const [availableValues, setAvailableValues] = useState<Value[]>(initialValues);
  const [currentTab, setCurrentTab] = useState<'all' | 'terminal' | 'instrumental' | 'work'>('all');

  const filteredValues = availableValues.filter(value => {
    if (currentTab === 'all') return true;
    return value.category === currentTab;
  });

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Find the value being moved
    let movedValue: Value | undefined;

    if (source.droppableId === 'available-values') {
      movedValue = availableValues.find(v => v.id === draggableId);
    } else {
      const sourceCategory = categories.find(c => c.id === source.droppableId);
      movedValue = sourceCategory?.values.find(v => v.id === draggableId);
    }

    if (!movedValue) return;

    // Remove from source
    if (source.droppableId === 'available-values') {
      setAvailableValues(prev => prev.filter(v => v.id !== draggableId));
    } else {
      setCategories(prev => prev.map(category =>
        category.id === source.droppableId
          ? { ...category, values: category.values.filter(v => v.id !== draggableId) }
          : category
      ));
    }

    // Add to destination
    if (destination.droppableId === 'available-values') {
      setAvailableValues(prev => [...prev, movedValue as Value]);
    } else {
      setCategories(prev => prev.map(category =>
        category.id === destination.droppableId
          ? {
              ...category,
              values: [
                ...category.values.slice(0, destination.index),
                movedValue as Value,
                ...category.values.slice(destination.index)
              ]
            }
          : category
      ));
    }
  }, [availableValues, categories]);

  const resetValues = () => {
    setAvailableValues(initialValues);
    setCategories(prev => prev.map(cat => ({ ...cat, values: [] })));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'terminal': return <Heart className="w-4 h-4" />;
      case 'instrumental': return <Target className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'terminal': return 'text-red-600 bg-red-50';
      case 'instrumental': return 'text-blue-600 bg-blue-50';
      case 'work': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="w-full py-6 px-4 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={resetValues}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Core Values</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Drag and drop the values below into categories based on their importance to you. This will help identify what truly matters in your life and career.
          </p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Available Values Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Values to Sort</h2>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setCurrentTab('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All ({availableValues.length})
                  </button>
                  <button
                    onClick={() => setCurrentTab('terminal')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'terminal' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className="w-3 h-3" />
                    <span>Life Goals</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('instrumental')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'instrumental' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Target className="w-3 h-3" />
                    <span>Behaviors</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('work')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'work' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>Work</span>
                  </button>
                </div>

                <Droppable droppableId="available-values">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] p-4 border-2 border-dashed rounded-xl transition-colors ${
                        snapshot.isDraggingOver ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {filteredValues.map((value, index) => (
                        <Draggable key={value.id} draggableId={value.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-3 mb-3 shadow-sm border cursor-move transition-all ${
                                snapshot.isDragging ? 'shadow-lg scale-105 rotate-2' : 'hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-900 text-sm">{value.name}</h3>
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getCategoryColor(value.category)}`}>
                                  {getCategoryIcon(value.category)}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{value.description}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {filteredValues.length === 0 && (
                        <div className="text-center text-gray-400 mt-16">
                          <p>All values have been sorted!</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="lg:col-span-2">
              <div className="grid gap-6">
                {categories.map((category) => (
                  <div key={category.id} className={`rounded-2xl border-2 p-6 ${category.color}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                      <span className="bg-white bg-opacity-70 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                        {category.values.length} values
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{category.description}</p>

                    <Droppable droppableId={category.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] p-4 border-2 border-dashed rounded-xl transition-colors ${
                            snapshot.isDraggingOver ? 'border-gray-400 bg-white bg-opacity-50' : 'border-gray-300 bg-white bg-opacity-30'
                          }`}
                        >
                          <div className="grid gap-3">
                            {category.values.map((value, index) => (
                              <Draggable key={value.id} draggableId={value.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white rounded-lg p-4 shadow-sm border cursor-move transition-all ${
                                      snapshot.isDragging ? 'shadow-lg scale-105 rotate-1' : 'hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-gray-900">{value.name}</h4>
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getCategoryColor(value.category)}`}>
                                        {getCategoryIcon(value.category)}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {category.values.length === 0 && (
                              <div className="text-center text-gray-400 py-8">
                                <p>Drop values here to categorize them as <strong>{category.title.toLowerCase()}</strong></p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Results Summary */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Values Summary</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${category.color}`}>
                  <span className="text-2xl font-bold text-gray-700">{category.values.length}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
                <p className="text-sm text-gray-600">{category.values.length} values categorized</p>
              </div>
            ))}
          </div>

          {categories.every(cat => cat.values.length > 0) && (
            <div className="mt-8 text-center">
              <Link
                href="/discover/values/results"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <span>View Detailed Results</span>
                <Target className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValuesDiscoveryPage;