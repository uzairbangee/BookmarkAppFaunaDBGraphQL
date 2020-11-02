import React from "react"
import TextField from '@material-ui/core/TextField';
import * as Yup from 'yup';
import { Formik, Form, ErrorMessage, Field } from 'formik';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { useQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';

const bookmarkSchema = Yup.object().shape({
  url: Yup.string()
  .matches(
      /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
      'Enter correct url!'
  )
  .required('Please enter url'),
  description: Yup.string()
    .max(50, 'Only 50 characters are allowed!')
    .required('Required'),
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      margin: '20px 0'
    }
  }),
);

const BOOKMARK_QUERY = gql`{
  bookmarks{
      id
      url
      description
  }
}`

const ADD_BOOKMARK = gql`
mutation addBookmark($url: String!, $description: String!){
  addBookmark(url: $url, description: $description){
   id
  }
}
`

const REMOVE_BOOKMARK = gql`
mutation removeBookmark($id: ID!){
  removeBookmark(id: $id){
   url
  }
}
`


export default function Home() {
  const classes = useStyles();
  const {loading, error, data } = useQuery(BOOKMARK_QUERY);
  const [addBookmark] = useMutation(ADD_BOOKMARK);
  const [removeBookmark] = useMutation(REMOVE_BOOKMARK);


  const onDelete = (id) => {
    removeBookmark({
      variables : {
        id: id
      },
      refetchQueries: [{query:BOOKMARK_QUERY}],
    })
  }

  return (
    <div>
      <h2>Bookmark App</h2>
      <Formik 
        initialValues={ {
            url: "",
            description: ""
        }} 
        validationSchema={bookmarkSchema}
        onSubmit = {(values, {resetForm}) => {
          addBookmark({
            variables : {
              url : values.url,
              description: values.description
            },
            refetchQueries: [{query:BOOKMARK_QUERY}],
          })
          resetForm({values: {
            url: "",
            description: ""
          }});
        }}
      >
        {
          (formik) => (
            <Form onSubmit={formik.handleSubmit}>
              <div>
                    <Field type="url" as={TextField} classes={{root: classes.textField}} variant="outlined" label="Url" name="url" id="url" fullWidth={true} />
                    <ErrorMessage name="url" render={(msg)=>(
                        <span style={{color:"red"}}>{msg}</span>
                    )} />
                </div>
                <div>
                    <Field type="text" as={TextField} classes={{root: classes.textField}} label="Description" variant="outlined" name="description" id="description" fullWidth={true}/>
                    <ErrorMessage name="description" render={(msg)=>(
                        <span style={{color:"red"}}>{msg}</span>
                    )} />
                </div>
                <div>
                    <button type="submit" className="add">
                      ADD
                    </button>
                </div>
            </Form>
          )
        }
      </Formik>
      <div className="bookmark__area">
        {
          loading ?
          "Loading ....."
          :
          data.bookmarks.length > 0 &&
          data.bookmarks.map(bookmark => (
              <div className="bookmark_box" key={bookmark.id}>
                <span className="close" onClick={() => onDelete(bookmark.id)}>X</span>
                <a href={bookmark.url} target="_blank">
                  <p className="description">{bookmark.description}</p>
                </a>
              </div>
          ))
        }
      </div>
    </div>
  )
}