'use client'
import { useState } from 'react'

const API_URL = 'http://127.0.0.1:8080'

type Message = {
  sender: string
  content: string
}

async function completion(prompt: string, callback: (res: string) => void) {
  const result = await fetch(`${API_URL}/completion`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt,
      temperature: 0.2,
      top_k: 40,
      top_p: 0.9,
      n_predict: 256,
      stop: ['\n### Human:'], // stop completion after generating this
      stream: true,
    }),
  })

  if (!result.ok || !result.body) {
    return
  }

  let reader = result.body.getReader()

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    const t = Buffer.from(value).toString('utf8')
    if (t.startsWith('data: ')) {
      const message = JSON.parse(t.substring(6))
      callback(message.content)
      if (message.stop) {
        break
      }
    }
  }

  return
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  return (
    <div className='flex min-h-screen flex-1 flex-col justify-between'>
      <header className='drag sticky top-0 z-50 flex w-full flex-row items-center border-b border-black/5 bg-gray-50/75 p-3 backdrop-blur-md'>
        <div className='mx-auto w-full max-w-xl leading-none'>
          <h1 className='text-sm font-medium'>LLaMa</h1>
          <h2 className='text-xs text-black/50'>Meta Platforms, Inc.</h2>
        </div>
      </header>
      <section className='mx-auto mb-10 w-full max-w-xl flex-1 break-words'>
        {messages.map((m, i) => (
          <div className='my-4 flex gap-4' key={i}>
            <div className='flex-none pr-2 text-lg'>{m.sender === 'human' ? '👩' : '🤖'}</div>
            <div className='flex-1 text-gray-900'>
              {m.content}
              {m.sender === 'bot' && <span className='relative -top-[3px] left-1 text-[10px] text-blue-600'>⬤</span>}
            </div>
          </div>
        ))}
      </section>
      <div className='sticky bottom-0 bg-gradient-to-b from-transparent to-white'>
        <textarea
          autoFocus
          rows={1}
          value={prompt}
          placeholder='Send a message...'
          onChange={e => setPrompt(e.target.value)}
          className='mx-auto my-4 block w-full max-w-xl resize-none rounded-xl border border-gray-200 px-5 py-3.5 text-[15px] shadow-lg shadow-black/5 focus:outline-none'
          onKeyDownCapture={async e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault() // Prevents the newline character from being inserted
              // Perform your desired action here, such as submitting the form or handling the entered text

              await setMessages(messages => {
                return [...messages, { sender: 'human', content: prompt }]
              })

              const index = messages.length + 1
              completion(prompt, res => {
                setMessages(messages => {
                  let message = messages[index]
                  if (!message) {
                    message = { sender: 'bot', content: '' }
                  }

                  message.content = message.content + res

                  return [...messages.slice(0, index), message]
                })
              })

              setPrompt('')
            }
          }}
        ></textarea>
      </div>
    </div>
  )
}