'use client';

import React from 'react';
import { Assignment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Award, 
  FileText, 
  Video, 
  Image as ImageIcon,
  ArrowLeft,
  Download,
  ExternalLink
} from 'lucide-react';
import { DiscussionThreadComponent } from '../lms/DiscussionThread';

interface AssignmentDetailViewProps {
  assignment: Assignment;
  onBack: () => void;
  isStudent?: boolean;
}

export const AssignmentDetailView: React.FC<AssignmentDetailViewProps> = ({
  assignment,
  onBack,
  isStudent = false,
}) => {
  // ContentType ID for Assignment is 43 (found via shell)
  const ASSIGNMENT_CONTENT_TYPE_ID = 43;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-brand-50 text-brand-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to list
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assignment Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-2 bg-brand-500" />
            <CardContent className="p-8 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4 text-brand-600" />
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                    <Award className="w-4 h-4 text-accent-500" />
                    {assignment.points} Points
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                    <FileText className="w-4 h-4 text-blue-500" />
                    {assignment.subject_name || 'General'}
                  </div>
                </div>
              </div>

              <div className="prose prose-brand max-w-none text-gray-700 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
              </div>

              {/* Attachments Section */}
              {(assignment.attachment_url || assignment.video_url || assignment.image_url) && (
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Resources</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignment.attachment_url && (
                      <a 
                        href={assignment.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Document Attachment</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-brand-600" />
                      </a>
                    )}
                    {assignment.video_url && (
                      <a 
                        href={assignment.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-50 text-red-600">
                            <Video className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Video Lesson</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <DiscussionThreadComponent 
              contentTypeId={ASSIGNMENT_CONTENT_TYPE_ID} 
              objectId={Number(assignment.id)} 
              title="Assignment Discussion"
            />
          </div>
        </div>

        {/* Right Column: Actions / Submission Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-brand-900 text-white">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg">Your Submission</h3>
              <p className="text-xs text-brand-200">
                {isStudent 
                  ? "Submit your work before the deadline to avoid late penalties."
                  : "View and grade students' work for this assignment."}
              </p>
              <Button className="w-full bg-accent-500 hover:bg-accent-600 text-brand-900 font-bold">
                {isStudent ? "Upload Work" : "Manage Submissions"}
              </Button>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-brand-50 border border-brand-100">
            <h4 className="text-sm font-bold text-brand-800 mb-2">Teacher's Note</h4>
            <p className="text-xs text-brand-600 leading-relaxed italic">
              "Please focus on showing your working for the algebra problems. Partial points will be awarded for correct steps."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
