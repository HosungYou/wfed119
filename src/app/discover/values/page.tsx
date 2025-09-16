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
  { id: 'tv1', name: 'Family Security', description: 'Ensuring the safety, well-being, and financial security of one\'s family', category: 'terminal' },
  { id: 'tv2', name: 'Personal Growth', description: 'Focusing on self-improvement, learning, and developing one\'s potential', category: 'terminal' },
  { id: 'tv3', name: 'Health and Wellness', description: 'Prioritizing physical, mental, and emotional well-being', category: 'terminal' },
  { id: 'tv4', name: 'National Security', description: 'Prioritizing the safety and stability of one\'s nation', category: 'terminal' },
  { id: 'tv5', name: 'Global Citizenship', description: 'Embracing a sense of belonging and responsibility to the global community', category: 'terminal' },
  { id: 'tv6', name: 'Inner Peace', description: 'Achieving inner tranquility, contentment, and balance', category: 'terminal' },
  { id: 'tv7', name: 'Social Justice', description: 'Aspiring for a fair, equitable, and just society', category: 'terminal' },
  { id: 'tv8', name: 'Mature Love', description: 'Experiencing a deep, committed relationship characterized by intimacy, passion, and commitment', category: 'terminal' },
  { id: 'tv9', name: 'A Sense of Accomplishment', description: 'Achieving goals and feeling successful in one\'s endeavors', category: 'terminal' },
  { id: 'tv10', name: 'A World of Beauty', description: 'Valuing and seeking beauty in nature, art, and life experiences', category: 'terminal' },
  { id: 'tv11', name: 'Spirituality', description: 'Pursuing a deeper understanding or connection beyond the material world', category: 'terminal' },
  { id: 'tv12', name: 'Recognition', description: 'Seeking acknowledgment, respect, and esteem from others', category: 'terminal' },
  { id: 'tv13', name: 'Freedom', description: 'Valuing autonomy, self-determination, and the right to make choices', category: 'terminal' },
  { id: 'tv14', name: 'Financial Freedom', description: 'Achieving economic independence; freedom from financial constraints', category: 'terminal' },
  { id: 'tv15', name: 'Pleasure', description: 'Seeking enjoyable, pleasurable, and satisfying experiences', category: 'terminal' },
  { id: 'tv16', name: 'Sustainable Planet', description: 'Advocating for an eco-friendly, sustainable world', category: 'terminal' },
  { id: 'tv17', name: 'Wisdom', description: 'Seeking knowledge, insight, and understanding to make sound judgments', category: 'terminal' },
  { id: 'tv18', name: 'Authenticity', description: 'Being true to oneself with sincerity and genuineness', category: 'terminal' },
  { id: 'tv19', name: 'True Friendship', description: 'Valuing deep, meaningful, and loyal friendships', category: 'terminal' },
  { id: 'tv20', name: 'Comfortable Life', description: 'Prioritizing contentment, ease, and security', category: 'terminal' },
  { id: 'tv21', name: 'A World at Peace', description: 'Aspiring for a world characterized by peace, cooperation, and mutual understanding', category: 'terminal' },
  { id: 'tv22', name: 'Happiness', description: 'Pursuing a state of contentedness and fulfillment, with joy and purpose', category: 'terminal' },
  { id: 'tv23', name: 'Innovation', description: 'Valuing creativity, progress, and new ideas that drive improvement', category: 'terminal' },
  { id: 'tv24', name: 'An Exciting Life', description: 'Seeking adventure, stimulation, and a life filled with excitement', category: 'terminal' },

  // Instrumental Values
  { id: 'iv1', name: 'Open-mindedness', description: 'Willingness to consider new ideas and revise views based on evidence', category: 'instrumental' },
  { id: 'iv2', name: 'Humility', description: 'Staying grounded and ready to learn from others', category: 'instrumental' },
  { id: 'iv3', name: 'Empathy', description: 'Resonating with others\' feelings and responding appropriately', category: 'instrumental' },
  { id: 'iv4', name: 'Tolerance', description: 'Broadly accepting and understanding differences even when uncomfortable', category: 'instrumental' },
  { id: 'iv5', name: 'Discipline', description: 'Acting consistently according to principles and rules', category: 'instrumental' },
  { id: 'iv6', name: 'Logical Thinking', description: 'Reaching conclusions through systematic, rational reasoning', category: 'instrumental' },
  { id: 'iv7', name: 'Helpfulness', description: 'Recognizing others\' needs and offering support', category: 'instrumental' },
  { id: 'iv8', name: 'Responsiveness', description: 'Responding quickly and sensitively to situations and needs', category: 'instrumental' },
  { id: 'iv9', name: 'Imagination', description: 'Envisioning possibilities beyond current reality', category: 'instrumental' },
  { id: 'iv10', name: 'Reliability', description: 'Keeping promises and acting consistently so others can depend on you', category: 'instrumental' },
  { id: 'iv11', name: 'Ambition', description: 'Holding big dreams and striving to realize them', category: 'instrumental' },
  { id: 'iv12', name: 'Courage', description: 'Choosing the right action despite fear or difficulty', category: 'instrumental' },
  { id: 'iv13', name: 'Competence', description: 'Possessing the ability and quality to perform tasks effectively', category: 'instrumental' },
  { id: 'iv14', name: 'Perseverance', description: 'Enduring hardship and not giving up', category: 'instrumental' },
  { id: 'iv15', name: 'Assertiveness', description: 'Expressing opinions and rights clearly and confidently', category: 'instrumental' },
  { id: 'iv16', name: 'Self-control', description: 'Regulating impulses and emotions for balanced behavior', category: 'instrumental' },
  { id: 'iv17', name: 'Adaptability', description: 'Adjusting oneself flexibly to changing environments', category: 'instrumental' },
  { id: 'iv18', name: 'Respect', description: 'Valuing others\' dignity and rights; being considerate', category: 'instrumental' },
  { id: 'iv19', name: 'Initiative', description: 'Taking the lead proactively and creating opportunities', category: 'instrumental' },
  { id: 'iv20', name: 'Intellectual Activity', description: 'Expanding knowledge and understanding through learning and thinking', category: 'instrumental' },
  { id: 'iv21', name: 'Integrity', description: 'Speaking facts without deceit; alignment between inner and outer self', category: 'instrumental' },
  { id: 'iv22', name: 'Creativity', description: 'Generating original ideas and solutions', category: 'instrumental' },
  { id: 'iv23', name: 'Cleanliness and Orderliness', description: 'Keeping spaces hygienic and organized for safety and efficiency', category: 'instrumental' },
  { id: 'iv24', name: 'Loyalty', description: 'Maintaining unwavering commitment and allegiance', category: 'instrumental' },

  // Work Values
  { id: 'wv1', name: 'Supervisory Opportunity', description: 'Gaining leadership experience by guiding and managing team members', category: 'work' },
  { id: 'wv2', name: 'Fairness', description: 'Working where members are treated equitably and justly', category: 'work' },
  { id: 'wv3', name: 'Relationships', description: 'Building positive relationships with colleagues and supervisors', category: 'work' },
  { id: 'wv4', name: 'Work–Life Balance', description: 'Maintaining harmony between work and personal life', category: 'work' },
  { id: 'wv5', name: 'Compensation', description: 'Receiving sufficient financial rewards', category: 'work' },
  { id: 'wv6', name: 'Contribution', description: 'Making meaningful impact and adding value through one\'s work', category: 'work' },
  { id: 'wv7', name: 'Task Variety', description: 'Experiencing diverse tasks and responsibilities', category: 'work' },
  { id: 'wv8', name: 'Challenge', description: 'Testing and developing abilities through difficult assignments', category: 'work' },
  { id: 'wv9', name: 'Autonomy/Independence', description: 'Being assured of performing tasks with minimal interference', category: 'work' },
  { id: 'wv10', name: 'Prestige', description: 'Earning respect through a reputable title or organization', category: 'work' },
  { id: 'wv11', name: 'Achievement', description: 'Feeling accomplishment and satisfaction by achieving goals', category: 'work' },
  { id: 'wv12', name: 'Advancement', description: 'Having opportunities to take on higher roles and responsibilities', category: 'work' },
  { id: 'wv13', name: 'Security/Stability', description: 'Ensured safe working conditions and stable employment', category: 'work' },
  { id: 'wv14', name: 'Travel', description: 'Visiting various locations through work', category: 'work' },
  { id: 'wv15', name: 'Geographic Location', description: 'Working in a location convenient for commuting and life', category: 'work' },
  { id: 'wv16', name: 'Flexibility', description: 'Flexible choices in working time or location', category: 'work' },
  { id: 'wv17', name: 'Ethics', description: 'Working in an environment with strong ethical standards', category: 'work' },
  { id: 'wv18', name: 'Recognition', description: 'Receiving appropriate evaluation and appreciation for efforts and results', category: 'work' },
  { id: 'wv19', name: 'Person–Job Fit', description: 'Having tasks that match one\'s abilities and disposition', category: 'work' },
  { id: 'wv20', name: 'Working Conditions', description: 'Having a pleasant and efficient physical work environment', category: 'work' },
  { id: 'wv21', name: 'Professional Development', description: 'Opportunities to learn and grow into a subject-matter expert', category: 'work' },
  { id: 'wv22', name: 'Supportive Supervision', description: 'Working under a supervisor who encourages and offers constructive guidance', category: 'work' },
  { id: 'wv23', name: 'Creativity', description: 'Exercising free, original ideas', category: 'work' },
  { id: 'wv24', name: 'Teamwork', description: 'Collaborating with colleagues to achieve shared goals', category: 'work' },
  { id: 'wv25', name: 'Innovation', description: 'Introducing new methods/technologies to create practical change', category: 'work' },
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
                    <span>Terminal Values</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('instrumental')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'instrumental' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Target className="w-3 h-3" />
                    <span>Instrumental Values</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('work')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'work' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>Work Values</span>
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