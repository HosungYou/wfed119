'use client';

import { useEffect, useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowRight, ArrowLeft, Upload, FileText, X,
  Sparkles, ExternalLink, Star, CheckCircle, AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { ModuleShell, ModuleCard, ModuleButton, ActivitySidebar, createActivitiesFromSteps } from '@/components/modules';

interface ONetCareer {
  onetCode: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  fitScore: number;
  keySkillsMatch: string[];
  salaryRange: string;
  growthOutlook: string;
  link: string;
}

interface ResumeAnalysis {
  professionalSummary: string;
  professionalSummaryKo: string;
  keyCompetencies: string[];
  keyCompetenciesKo: string[];
  experienceLevel: string;
  suggestedCareers: ONetCareer[];
  overallFit: number;
}

const STEPS = [
  { id: 'step1', label: 'Holland Assessment', labelKo: 'Holland 적성 검사' },
  { id: 'step2', label: 'Resume AI Review', labelKo: '이력서 AI 분석' },
  { id: 'step3', label: 'AI Career Suggestions', labelKo: 'AI 경력 추천' },
  { id: 'step4', label: 'Career Comparison', labelKo: '경력 비교' },
];

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

const FILE_EXTENSIONS = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'text/plain': '.txt',
};

export default function CareerOptionsStep2() {
  const router = useRouter();
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [selectedCareers, setSelectedCareers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/discover/career-options/session');
      const data = await res.json();

      if (data.current_step < 2) {
        router.push('/discover/career-options/step1');
        return;
      }

      setSession(data);

      // Load existing analysis if any
      if (data.resume_analysis) {
        setAnalysis(data.resume_analysis);
        if (data.resume_analysis.suggestedCareers) {
          // Pre-select all careers
          const selected = new Set<string>(
            data.resume_analysis.suggestedCareers.map((c: ONetCareer) => c.onetCode)
          );
          setSelectedCareers(selected);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('[Career Step 2] Error:', error);
      setLoading(false);
    }
  }

  function validateFile(file: File): boolean {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setFileError(
        language === 'ko'
          ? 'PDF, Word(.docx, .doc), 또는 텍스트(.txt) 파일만 지원합니다.'
          : 'Only PDF, Word (.docx, .doc), or text (.txt) files are supported.'
      );
      return false;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError(
        language === 'ko'
          ? '파일 크기는 10MB 이하여야 합니다.'
          : 'File size must be 10MB or less.'
      );
      return false;
    }

    setFileError(null);
    return true;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setAnalysis(null);
      }
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setAnalysis(null);
      }
    }
  }

  function removeFile() {
    setUploadedFile(null);
    setAnalysis(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function analyzeResume() {
    if (!uploadedFile) return;

    setAnalyzing(true);
    setFileError(null);

    try {
      // Read file content
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('hollandCode', session?.holland_code || '');
      formData.append('hollandScores', JSON.stringify(session?.holland_scores || {}));

      const res = await fetch('/api/discover/career-options/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();

      if (data.analysis) {
        setAnalysis(data.analysis);
        // Pre-select all careers
        const selected = new Set<string>(
          data.analysis.suggestedCareers.map((c: ONetCareer) => c.onetCode)
        );
        setSelectedCareers(selected);

        // Save to session
        await fetch('/api/discover/career-options/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_analysis: data.analysis }),
        });
      }
    } catch (error) {
      console.error('[Career Step 2] Analysis error:', error);
      setFileError(
        language === 'ko'
          ? '이력서 분석 중 오류가 발생했습니다. 다시 시도해주세요.'
          : 'Error analyzing resume. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleCareerSelection(onetCode: string) {
    setSelectedCareers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(onetCode)) {
        newSet.delete(onetCode);
      } else {
        newSet.add(onetCode);
      }
      return newSet;
    });
  }

  async function handleNext() {
    if (selectedCareers.size < 1) {
      alert(
        language === 'ko'
          ? '최소 1개의 경력을 선택해주세요.'
          : 'Please select at least 1 career.'
      );
      return;
    }

    setSaving(true);
    try {
      // Filter selected careers
      const selectedCareerList = analysis?.suggestedCareers.filter(
        c => selectedCareers.has(c.onetCode)
      ) || [];

      await fetch('/api/discover/career-options/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: 3,
          resume_analysis: analysis,
          selected_onet_careers: selectedCareerList,
        }),
      });

      router.push('/discover/career-options/step3');
    } catch (error) {
      console.error('[Career Step 2] Save error:', error);
      alert(language === 'ko' ? '저장 실패' : 'Save failed');
      setSaving(false);
    }
  }

  const activities = createActivitiesFromSteps(STEPS, '/discover/career-options', 2, [1]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <ModuleShell
      moduleId="career-options"
      currentStep={2}
      totalSteps={4}
      title={language === 'ko' ? '이력서 AI 분석' : 'Resume AI Review'}
      sidebar={<ActivitySidebar activities={activities} title="Steps" titleKo="단계" />}
    >
      <div className="space-y-6">
        {/* Holland Code Display */}
        {session?.holland_code && (
          <ModuleCard padding="normal" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-indigo-600">
                  {language === 'ko' ? 'Holland 코드' : 'Holland Code'}
                </p>
                <p className="text-xl font-bold text-indigo-700">{session.holland_code}</p>
              </div>
            </div>
          </ModuleCard>
        )}

        {/* Instructions */}
        <ModuleCard padding="normal">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ko' ? '이력서를 업로드하세요' : 'Upload Your Resume'}
          </h2>
          <p className="text-sm text-gray-600">
            {language === 'ko'
              ? 'AI가 이력서를 분석하여 O*NET 직업 데이터베이스와 매칭하고, 적합한 경력 옵션을 제안합니다.'
              : 'AI will analyze your resume, match it with O*NET occupational database, and suggest suitable career options.'}
          </p>
        </ModuleCard>

        {/* File Upload Area */}
        {!analysis && (
          <ModuleCard padding="normal">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : uploadedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-4">
                  <FileText className="w-12 h-12 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="text-gray-600 mb-2">
                    {language === 'ko'
                      ? '파일을 여기에 드래그하거나'
                      : 'Drag and drop your file here, or'}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    {language === 'ko' ? '파일 선택' : 'browse files'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    PDF, Word (.docx, .doc), Text (.txt) - Max 10MB
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {fileError && (
              <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {fileError}
              </div>
            )}

            {uploadedFile && !analyzing && (
              <div className="mt-6 flex justify-center">
                <ModuleButton
                  onClick={analyzeResume}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {language === 'ko' ? 'AI 분석 시작' : 'Start AI Analysis'}
                </ModuleButton>
              </div>
            )}

            {analyzing && (
              <div className="mt-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-gray-600">
                  {language === 'ko'
                    ? 'AI가 이력서를 분석하고 있습니다...'
                    : 'AI is analyzing your resume...'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {language === 'ko' ? '잠시만 기다려주세요' : 'This may take a moment'}
                </p>
              </div>
            )}
          </ModuleCard>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Professional Summary */}
            <ModuleCard padding="normal" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                {language === 'ko' ? '전문 역량 요약' : 'Professional Summary'}
              </h3>
              <p className="text-gray-700">
                {language === 'ko' ? analysis.professionalSummaryKo : analysis.professionalSummary}
              </p>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {language === 'ko' ? '핵심 역량' : 'Key Competencies'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(language === 'ko' ? analysis.keyCompetenciesKo : analysis.keyCompetencies).map((comp, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white rounded-full text-sm text-indigo-700 border border-indigo-200"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {language === 'ko' ? '종합 적합도' : 'Overall Fit'}
                  </span>
                  <span className="text-lg font-bold text-indigo-600">{analysis.overallFit}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {language === 'ko' ? '경력 수준' : 'Experience Level'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{analysis.experienceLevel}</span>
                </div>
              </div>
            </ModuleCard>

            {/* O*NET Career Suggestions */}
            <ModuleCard padding="normal">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {language === 'ko' ? 'O*NET 추천 직업' : 'O*NET Career Matches'}
                </h3>
                <span className="text-sm text-gray-500">
                  {selectedCareers.size} {language === 'ko' ? '개 선택됨' : 'selected'}
                </span>
              </div>

              <div className="space-y-4">
                {analysis.suggestedCareers.map((career) => (
                  <div
                    key={career.onetCode}
                    onClick={() => toggleCareerSelection(career.onetCode)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCareers.has(career.onetCode)
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {language === 'ko' ? career.titleKo : career.title}
                          </h4>
                          <span className="text-xs text-gray-400">{career.onetCode}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {language === 'ko' ? career.descriptionKo : career.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {career.keySkillsMatch.slice(0, 4).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>💰 {career.salaryRange}</span>
                          <span>📈 {career.growthOutlook}</span>
                          <a
                            href={career.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                          >
                            O*NET <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedCareers.has(career.onetCode)
                            ? 'bg-indigo-500'
                            : 'border-2 border-gray-300'
                        }`}>
                          {selectedCareers.has(career.onetCode) && (
                            <Star className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-indigo-600">{career.fitScore}%</span>
                          <p className="text-xs text-gray-400">
                            {language === 'ko' ? '적합도' : 'Fit'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModuleCard>

            {/* Re-analyze option */}
            <ModuleCard padding="normal" className="bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {language === 'ko'
                    ? '다른 이력서로 다시 분석하시겠습니까?'
                    : 'Want to analyze a different resume?'}
                </p>
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setUploadedFile(null);
                    setSelectedCareers(new Set());
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {language === 'ko' ? '새로 시작' : 'Start Over'}
                </button>
              </div>
            </ModuleCard>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <ModuleButton
            onClick={() => router.push('/discover/career-options/step1')}
            variant="secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Back'}
          </ModuleButton>
          <ModuleButton
            onClick={handleNext}
            disabled={saving || !analysis || selectedCareers.size < 1}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {language === 'ko' ? 'AI 경력 추천받기' : 'Get AI Career Suggestions'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </ModuleButton>
        </div>
      </div>
    </ModuleShell>
  );
}
