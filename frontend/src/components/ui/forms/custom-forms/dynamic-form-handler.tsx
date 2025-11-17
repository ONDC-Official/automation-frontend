import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { SubmitEventParams } from '../../../../types/flow-types';
import jsonpath from 'jsonpath';
import { FormFieldConfigType } from '../config-form/config-form';
import { useSession } from '../../../../context/context';

interface DynamicFormHandlerProps {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  referenceData?: Record<string, any>;
  sessionId: string;
  transactionId: string;
  formConfig?: FormFieldConfigType;
}

export default function DynamicFormHandler({
  submitEvent,
  referenceData,
  sessionId,
  transactionId,
  formConfig
}: DynamicFormHandlerProps) {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'completed' | 'error'>('idle');
  const [formUrl, setFormUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollCount, setPollCount] = useState<number>(0);
  
  // Get session context to update session data
  const { setSessionData } = useSession();
  
  // Use refs to prevent page refresh
  const pollingIntervalRef = useRef<number | null>(null);
  const formWindowRef = useRef<Window | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);

  // Extract form URL from reference data (same way as HTML_FORM)
  const formServiceUrl = useMemo<string>(() => {
    if (!formConfig || !formConfig.reference) {
      console.warn('⚠️ No reference field found in form config');
      return '';
    }
    
    try {
      const url = jsonpath.query(
        { reference_data: referenceData },
        formConfig.reference
      )[0] || '';
      
      console.log('✅ Extracted form URL from reference:', url);
      console.log('   Reference path:', formConfig.reference);
      console.log('   Reference data:', referenceData);
      
      return url as string;
    } catch (error) {
      console.error('❌ Error extracting form URL from reference:', error);
      return '';
    }
  }, [formConfig, referenceData]);

  // Cleanup function - prevents memory leaks and ensures no refresh
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
    localStorage.removeItem('dynamic_form_flow_active');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Check completion function - polls backend to check if form was submitted
  const checkCompletion = useCallback(async () => {
    console.log('🔍 [FORM] Checking completion: sessionId:', sessionId, 'transactionId:', transactionId);
    if (hasCompletedRef.current) return;

    try {
      setPollCount(prev => prev + 1);

      // Check if form was submitted by querying the session data
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/sessions`,
        {
          params: {
            session_id: sessionId
          },
          timeout: 5000
        }
      );

      console.log('Poll result:', response.data, 'Count:', pollCount + 1);

      // Update session context with latest data so mapped-flow can see formSubmissions
      if (setSessionData && response.data) {
        setSessionData(response.data);
      }

      // Check if the form submission was completed for this transaction
      const formSubmitted = response.data?.formSubmissions?.[transactionId];
      
      console.log('🔍 [DynamicForm] Checking for submission:', {
        transactionId,
        formSubmitted,
        hasCompletedRef: hasCompletedRef.current,
        allSubmissions: response.data?.formSubmissions
      });
      
      if (formSubmitted && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        
        console.log('✅ [DynamicForm] Form submission detected:', formSubmitted);
        console.log('🛑 [DynamicForm] Stopping polling');
        
        // Stop polling immediately
        cleanup();

        // Close form tab if still open
        if (formWindowRef.current && !formWindowRef.current.closed) {
          try {
            formWindowRef.current.close();
            console.log('🪟 [DynamicForm] Closed form window');
          } catch (e) {
            console.log('Could not close form window:', e);
          }
        }

        // Immediately submit to proceed with flow
        // Pass the submission_id just like HTML_FORM does
        // Do NOT show completed state - let parent handle closing the modal
        try {
          const submission_id = formSubmitted.submission_id || '';
          console.log('📤 [DynamicForm] Calling submitEvent with submission_id:', submission_id);
          console.log('📤 [DynamicForm] submitEvent function:', typeof submitEvent);
          
          await submitEvent({
            jsonPath: { submission_id: submission_id },
            formData: { submission_id: submission_id }
          });
          
          // Parent component will close the popup modal after submitEvent completes
          console.log('✅ [DynamicForm] submitEvent completed successfully');
        } catch (error) {
          console.error('❌ [DynamicForm] Error submitting event:', error);
          setErrorMessage('Form complete but failed to proceed. Please try again.');
          setStatus('error');
        }
      }
    } catch (error: any) {
      console.error('Error checking completion:', error.message);
    }
  }, [sessionId, transactionId, submitEvent, cleanup, pollCount, setSessionData]);

  // Start polling function
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('Already polling, skipping');
      return;
    }

    isPollingRef.current = true;
    setPollCount(0);

    console.log('Starting polling for transaction:', transactionId);

    // Poll immediately first time
    checkCompletion();

    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkCompletion();
    }, 3000);

  }, [transactionId, checkCompletion]);

  // Handle start form - NO navigation/refresh
  const handleOpenForm = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // CRITICAL: Open window IMMEDIATELY to preserve user gesture (before async calls)
    // Otherwise popup blockers will prevent window.open after await
    const formWindow = window.open('about:blank', '_blank', 'width=1200,height=800');
    
    if (!formWindow) {
      setStatus('error');
      setErrorMessage('Could not open form window. Please allow popups for this site.');
      return;
    }

    formWindowRef.current = formWindow;

    // Show loading message in the popup while we fetch the URL
    try {
      formWindow.document.open();
      formWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Form...</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: #f3f4f6;
              }
              .loader { 
                text-align: center; 
              }
              .spinner {
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <p>Loading your form...</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Please wait...</p>
            </div>
          </body>
        </html>
      `);
      formWindow.document.close();
    } catch (writeError) {
      console.warn('Could not write loading content to popup:', writeError);
      // Continue anyway - the navigation will still work
    }

    try {
      setStatus('waiting');
      setErrorMessage('');
      setPollCount(0);

      // Mark flow as active in localStorage (prevents accidental navigation)
      localStorage.setItem('dynamic_form_flow_active', 'true');

      console.log('🔍 [FORM] sessionId:', sessionId);
      console.log('🔍 [FORM] transactionId:', transactionId);
      console.log('🔍 [FORM] formServiceUrl (from reference):', formServiceUrl);
      console.log('🔍 [FORM] referenceData:', referenceData);
      
      if (!transactionId) {
        throw new Error('Transaction ID is missing! Cannot create form URL.');
      }

      if (!formServiceUrl) {
        throw new Error('Form service URL is missing in reference_data! Make sure the form URL is generated in the mock service.');
      }

      console.log('📡 Calling form service at:', formServiceUrl);
      
      // The formServiceUrl already contains all query parameters (session_id, flow_id, transaction_id)
      // since it's generated dynamically by the mock service generator
      // Just call it directly to get the JSON response with formUrl
      // For dynamic forms, this will return: { success: true, type: "dynamic", formUrl: "...", message: "..." }
      const response = await axios.get(formServiceUrl, {
        timeout: 10000
      });

      console.log('✅ Form service response:', response.data);
      console.log('✅ Response type:', typeof response.data);
      
      // Check if response is JSON with formUrl (dynamic form)
      if (response.data && typeof response.data === 'object' && response.data.formUrl) {
        const dynamicFormUrl = response.data.formUrl;
        console.log('✅ Got dynamic form URL:', dynamicFormUrl);
        
        if (!dynamicFormUrl) {
          throw new Error('Form URL is empty in response!');
        }
        
        // Store the URL to open in new tab
        setFormUrl(dynamicFormUrl);

        // Navigate the already-opened window to the form URL
        if (formWindow && !formWindow.closed) {
          formWindow.location.href = dynamicFormUrl;
        } else {
          throw new Error('Form window was closed before navigation');
        }

        // Start polling for completion
        startPolling();
        return;
      }
      
      // If we get here, response might be HTML or unexpected format
      throw new Error('Expected JSON response with formUrl, but got: ' + typeof response.data);

    } catch (error: any) {
      console.error('Error opening form:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to open form');
      
      // Close the popup if we failed to get the URL
      if (formWindow && !formWindow.closed) {
        try {
          formWindow.close();
        } catch (e) {
          console.log('Could not close form window:', e);
        }
      }
      
      cleanup();
    }
  }, [sessionId, transactionId, referenceData, formServiceUrl, startPolling, cleanup]);

  // Handle reopen - NO navigation
  const handleReopenForm = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (formUrl) {
      const formWindow = window.open(formUrl, '_blank', 'noopener,noreferrer,width=1200,height=800');
      formWindowRef.current = formWindow;
    }
  }, [formUrl]);

  // Handle retry - NO navigation
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    cleanup();
    setStatus('idle');
    setErrorMessage('');
    setPollCount(0);
    hasCompletedRef.current = false;
  }, [cleanup]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Complete Form</h2>

      {status === 'idle' && (
        <div>
          <p className="text-gray-600 mb-4">
            Click the button below to open and complete the required form.
            A new tab will open where you can fill out the form.
          </p>
          <button
            type="button"
            onClick={handleOpenForm}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Open Form
          </button>
        </div>
      )}

      {status === 'waiting' && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Waiting for Form Submission</h3>
          <p className="text-gray-600 mb-4">
            Please complete and submit the form in the tab that was opened.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Checking automatically... (Poll #{pollCount})
          </p>
          <p className="text-xs text-gray-400 mb-4">
            This page will NOT refresh. Stay here while completing the form.
          </p>
          <button
            type="button"
            onClick={handleReopenForm}
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none"
          >
            Reopen Form Tab
          </button>
        </div>
      )}

      {status === 'completed' && (
        <div className="text-center text-green-600">
          <div className="text-5xl mb-4">✓</div>
          <h3 className="text-lg font-medium mb-2">Form Submitted Successfully!</h3>
          <p className="text-gray-600">Proceeding to next step...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">✕</div>
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

